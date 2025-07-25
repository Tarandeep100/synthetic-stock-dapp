import { ethers } from "hardhat";
import * as cron from "node-cron";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Oracle Updater Service for AAPL Price Feeds
 * Phase 5: Oracle updater cron per SDD requirements
 * Updates every 5 minutes during market hours per SDD
 */

interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

interface PriceProvider {
  name: string;
  getPrice(symbol: string): Promise<StockPrice>;
}

// Multiple price providers for redundancy
class AlphaVantageProvider implements PriceProvider {
  name = "AlphaVantage";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getPrice(symbol: string): Promise<StockPrice> {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`;
    
    try {
      const response = await axios.get(url, { timeout: 10000 });
      const quote = response.data["Global Quote"];
      
      return {
        symbol,
        price: parseFloat(quote["05. price"]),
        change: parseFloat(quote["09. change"]),
        changePercent: parseFloat(quote["10. change percent"].replace('%', '')),
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`AlphaVantage error: ${error}`);
    }
  }
}

class PolygonProvider implements PriceProvider {
  name = "Polygon.io";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getPrice(symbol: string): Promise<StockPrice> {
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apikey=${this.apiKey}`;
    
    try {
      const response = await axios.get(url, { timeout: 10000 });
      const result = response.data.results[0];
      
      return {
        symbol,
        price: result.c, // closing price
        change: result.c - result.o, // close - open
        changePercent: ((result.c - result.o) / result.o) * 100,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Polygon error: ${error}`);
    }
  }
}

class MockProvider implements PriceProvider {
  name = "Mock";
  private basePrice = 150;
  private volatility = 0.02; // 2% volatility

  async getPrice(symbol: string): Promise<StockPrice> {
    // Simulate realistic price movement
    const randomChange = (Math.random() - 0.5) * this.volatility;
    const price = this.basePrice * (1 + randomChange);
    
    return {
      symbol,
      price: Number(price.toFixed(2)),
      change: price - this.basePrice,
      changePercent: randomChange * 100,
      timestamp: Date.now()
    };
  }
}

export class OracleUpdater {
  private providers: PriceProvider[] = [];
  private oracleContract: any;
  private isRunning = false;
  private lastPrice = 0;
  private lastUpdate = 0;
  private updateCount = 0;
  private errorCount = 0;

  // Configuration
  private readonly SYMBOL = "AAPL";
  private readonly UPDATE_INTERVAL = "*/5 * * * *"; // Every 5 minutes per SDD
  private readonly MARKET_HOURS_CRON = "*/5 9-16 * * 1-5"; // Market hours only
  private readonly MAX_PRICE_CHANGE = 0.1; // 10% max change per SDD
  private readonly MIN_PROVIDERS = 2; // Minimum providers for consensus

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize price providers based on available API keys
    if (process.env.ALPHAVANTAGE_API_KEY) {
      this.providers.push(new AlphaVantageProvider(process.env.ALPHAVANTAGE_API_KEY));
    }
    
    if (process.env.POLYGON_API_KEY) {
      this.providers.push(new PolygonProvider(process.env.POLYGON_API_KEY));
    }
    
    // Always include mock provider for development
    this.providers.push(new MockProvider());
    
    console.log(`🔧 Initialized ${this.providers.length} price providers:`, 
      this.providers.map(p => p.name).join(", "));
  }

  async initialize() {
    try {
      console.log("🚀 Initializing Oracle Updater Service...");
      
      // Get Oracle contract instance
      const oracleAddress = process.env.ORACLE_ADAPTER_ADDRESS;
      if (!oracleAddress) {
        throw new Error("ORACLE_ADAPTER_ADDRESS not set in environment");
      }

      const OracleAdapter = await ethers.getContractFactory("OracleAdapter");
      this.oracleContract = OracleAdapter.attach(oracleAddress);
      
      // Verify connection
      const [currentPrice, lastUpdated] = await this.oracleContract.getPrice();
      console.log(`✅ Connected to Oracle at ${oracleAddress}`);
      console.log(`📊 Current price: $${ethers.formatUnits(currentPrice, 8)}`);
      console.log(`⏰ Last updated: ${new Date(Number(lastUpdated) * 1000).toISOString()}`);
      
      this.lastPrice = Number(ethers.formatUnits(currentPrice, 8));
      this.lastUpdate = Number(lastUpdated);
      
    } catch (error) {
      console.error("❌ Failed to initialize Oracle Updater:", error);
      throw error;
    }
  }

  async fetchPriceConsensus(): Promise<StockPrice> {
    console.log(`🔍 Fetching ${this.SYMBOL} price from ${this.providers.length} providers...`);
    
    const promises = this.providers.map(async provider => {
      try {
        const price = await provider.getPrice(this.SYMBOL);
        console.log(`✅ ${provider.name}: $${price.price} (${price.changePercent.toFixed(2)}%)`);
        return price;
      } catch (error) {
        console.error(`❌ ${provider.name} failed:`, error.message);
        return null;
      }
    });

    const results = (await Promise.all(promises)).filter(Boolean) as StockPrice[];
    
    if (results.length < this.MIN_PROVIDERS) {
      throw new Error(`Insufficient price providers (${results.length}/${this.MIN_PROVIDERS})`);
    }

    // Calculate consensus price (median)
    const prices = results.map(r => r.price).sort((a, b) => a - b);
    const medianPrice = prices[Math.floor(prices.length / 2)];
    
    // Calculate average change percent
    const avgChangePercent = results.reduce((sum, r) => sum + r.changePercent, 0) / results.length;
    
    console.log(`📊 Consensus price: $${medianPrice} from ${results.length} providers`);
    
    return {
      symbol: this.SYMBOL,
      price: medianPrice,
      change: medianPrice - this.lastPrice,
      changePercent: avgChangePercent,
      timestamp: Date.now()
    };
  }

  async updatePrice(): Promise<void> {
    try {
      console.log(`\n🔄 [${new Date().toISOString()}] Starting price update...`);
      
      // Fetch consensus price
      const priceData = await this.fetchPriceConsensus();
      
      // Validate price change
      if (this.lastPrice > 0) {
        const priceChange = Math.abs(priceData.price - this.lastPrice) / this.lastPrice;
        if (priceChange > this.MAX_PRICE_CHANGE) {
          throw new Error(`Price change too large: ${(priceChange * 100).toFixed(2)}% (max: ${this.MAX_PRICE_CHANGE * 100}%)`);
        }
      }

      // Convert price to oracle format (8 decimals)
      const oraclePrice = ethers.parseUnits(priceData.price.toFixed(8), 8);
      
      console.log(`📝 Updating oracle with price: $${priceData.price} (${oraclePrice.toString()})`);
      
      // Update oracle contract
      const [signer] = await ethers.getSigners();
      const tx = await this.oracleContract.connect(signer).pushPrice(oraclePrice);
      
      console.log(`📡 Transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`✅ Price updated successfully! Gas used: ${receipt.gasUsed.toString()}`);
      
      // Update tracking
      this.lastPrice = priceData.price;
      this.lastUpdate = Math.floor(Date.now() / 1000);
      this.updateCount++;
      
      // Log statistics
      console.log(`📈 Update #${this.updateCount} completed`);
      console.log(`💰 New price: $${priceData.price} (${priceData.changePercent >= 0 ? '+' : ''}${priceData.changePercent.toFixed(2)}%)`);
      
    } catch (error) {
      this.errorCount++;
      console.error(`❌ Price update failed (error #${this.errorCount}):`, error.message);
      
      // Alert if too many errors
      if (this.errorCount >= 5) {
        console.error("🚨 Too many consecutive errors! Manual intervention required.");
      }
    }
  }

  startScheduler() {
    if (this.isRunning) {
      console.log("⚠️ Scheduler already running");
      return;
    }

    console.log("🕐 Starting Oracle price update scheduler...");
    console.log(`📅 Schedule: Every 5 minutes during market hours`);
    console.log(`🌍 Market hours: 9:00-16:00 EST, Monday-Friday`);
    
    // Schedule price updates (every 5 minutes during market hours)
    cron.schedule(this.MARKET_HOURS_CRON, async () => {
      await this.updatePrice();
    }, {
      scheduled: true,
      timezone: "America/New_York" // EST timezone for US market hours
    });

    // Schedule for development/testing (every 5 minutes always)
    if (process.env.NODE_ENV === "development") {
      cron.schedule(this.UPDATE_INTERVAL, async () => {
        await this.updatePrice();
      });
      console.log("🔧 Development mode: Updates every 5 minutes (24/7)");
    }

    // Health check every hour
    cron.schedule("0 * * * *", () => {
      this.healthCheck();
    });

    this.isRunning = true;
    console.log("✅ Oracle scheduler started successfully!");
  }

  stopScheduler() {
    if (!this.isRunning) {
      console.log("⚠️ Scheduler not running");
      return;
    }

    cron.destroy();
    this.isRunning = false;
    console.log("🛑 Oracle scheduler stopped");
  }

  private healthCheck() {
    const now = Math.floor(Date.now() / 1000);
    const timeSinceUpdate = now - this.lastUpdate;
    
    console.log("\n🔍 Oracle Health Check:");
    console.log(`📊 Total updates: ${this.updateCount}`);
    console.log(`❌ Total errors: ${this.errorCount}`);
    console.log(`💰 Last price: $${this.lastPrice}`);
    console.log(`⏰ Last update: ${timeSinceUpdate}s ago`);
    console.log(`🏥 Status: ${timeSinceUpdate > 600 ? '🔴 STALE' : '🟢 HEALTHY'}`);
    
    if (timeSinceUpdate > 600) { // 10 minutes
      console.warn("🚨 Price data is stale! Manual check required.");
    }
  }

  async getStatus() {
    try {
      const [latestPrice, lastUpdated, updateCount, isFresh] = await this.oracleContract.getOracleStats();
      
      return {
        latestPrice: Number(ethers.formatUnits(latestPrice, 8)),
        lastUpdated: Number(lastUpdated),
        updateCount: Number(updateCount),
        isFresh,
        serviceTotalUpdates: this.updateCount,
        serviceErrors: this.errorCount,
        isRunning: this.isRunning
      };
    } catch (error) {
      console.error("Failed to get oracle status:", error);
      return null;
    }
  }

  // Manual update trigger
  async forceUpdate() {
    console.log("🚀 Manual price update triggered...");
    await this.updatePrice();
  }
}

// CLI interface
async function main() {
  const updater = new OracleUpdater();
  
  try {
    await updater.initialize();
    
    const command = process.argv[2];
    
    switch (command) {
      case "start":
        updater.startScheduler();
        // Keep process alive
        process.on('SIGINT', () => {
          console.log("\n🛑 Shutting down Oracle Updater...");
          updater.stopScheduler();
          process.exit(0);
        });
        break;
        
      case "update":
        await updater.forceUpdate();
        break;
        
      case "status":
        const status = await updater.getStatus();
        console.log("📊 Oracle Status:", JSON.stringify(status, null, 2));
        break;
        
      default:
        console.log("Usage:");
        console.log("  yarn oracle start   - Start the scheduled updater");
        console.log("  yarn oracle update  - Force a price update");
        console.log("  yarn oracle status  - Check oracle status");
    }
    
  } catch (error) {
    console.error("❌ Oracle Updater failed:", error);
    process.exit(1);
  }
}

// Export for use in other modules
export default OracleUpdater;

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
} 