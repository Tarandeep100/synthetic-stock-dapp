/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type { Signer, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../../common";
import type {
  OracleAdapter,
  OracleAdapterInterface,
} from "../../contracts/OracleAdapter";

const _abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AccessControlBadConfirmation",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "neededRole",
        type: "bytes32",
      },
    ],
    name: "AccessControlUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
    ],
    name: "AddressEmptyCode",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "ERC1967InvalidImplementation",
    type: "error",
  },
  {
    inputs: [],
    name: "ERC1967NonPayable",
    type: "error",
  },
  {
    inputs: [],
    name: "EnforcedPause",
    type: "error",
  },
  {
    inputs: [],
    name: "ExpectedPause",
    type: "error",
  },
  {
    inputs: [],
    name: "FailedInnerCall",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidInitialization",
    type: "error",
  },
  {
    inputs: [],
    name: "NotInitializing",
    type: "error",
  },
  {
    inputs: [],
    name: "UUPSUnauthorizedCallContext",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "slot",
        type: "bytes32",
      },
    ],
    name: "UUPSUnsupportedProxiableUUID",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint64",
        name: "version",
        type: "uint64",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "admin",
        type: "address",
      },
    ],
    name: "OperatorAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "admin",
        type: "address",
      },
    ],
    name: "OperatorRemoved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "int256",
        name: "newPrice",
        type: "int256",
      },
      {
        indexed: true,
        internalType: "int256",
        name: "oldPrice",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "PriceUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "Upgraded",
    type: "event",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_PRICE",
    outputs: [
      {
        internalType: "int256",
        name: "",
        type: "int256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_PRICE_AGE",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_PRICE_CHANGE",
    outputs: [
      {
        internalType: "int256",
        name: "",
        type: "int256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MIN_PRICE",
    outputs: [
      {
        internalType: "int256",
        name: "",
        type: "int256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MIN_UPDATE_INTERVAL",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "OPERATOR_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "UPGRADER_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "UPGRADE_INTERFACE_VERSION",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "addOperator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getOracleStats",
    outputs: [
      {
        internalType: "int256",
        name: "latestPrice",
        type: "int256",
      },
      {
        internalType: "uint256",
        name: "lastUpdated",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "updateCount",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isFresh",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPrice",
    outputs: [
      {
        internalType: "int256",
        name: "price",
        type: "int256",
      },
      {
        internalType: "uint256",
        name: "lastUpdated",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPriceUnsafe",
    outputs: [
      {
        internalType: "int256",
        name: "price",
        type: "int256",
      },
      {
        internalType: "uint256",
        name: "lastUpdated",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isStale",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleAdmin",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "hasRole",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "admin",
        type: "address",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "isPriceFresh",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "proxiableUUID",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "int256",
        name: "newPrice",
        type: "int256",
      },
    ],
    name: "pushPrice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "removeOperator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "callerConfirmation",
        type: "address",
      },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newImplementation",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "version",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
] as const;

const _bytecode =
  "0x60a080604052346100cc57306080527ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a009081549060ff8260401c166100bd57506001600160401b036002600160401b031982821601610078575b60405161166990816100d28239608051818181610b500152610c300152f35b6001600160401b031990911681179091556040519081527fc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d290602090a1388080610059565b63f92ee8a960e01b8152600490fd5b600080fdfe608060408181526004918236101561001657600080fd5b600092833560e01c91826301c11d9614610ff65750816301ffc9a714610fa05781632084bf9f14610f80578163248a9ca314610f485781632f2ff15d14610f1e57816336568abe14610ed85781634779db5614610e7a5781634f1ef28614610bb457816352d1902d14610b3b57816354fd4d5014610afe5781635c975abb14610abb57816391d1485414610a675781639870d7fe146109a357816398d5fdca146108b35781639d7f7e8614610896578163a217fddf1461087b578163ac8a584a1461081d578163ad3cb1cc146107dc578163ad9f20a6146107bd578163bd3be27c146107a1578163c4d66de8146105e0578163c6c035b514610569578163d547741f1461051c578163df2870a9146104b7578163efe5db25146101b357508063f5b541a61461018b5763f72c0d8b1461014e57600080fd5b34610187578160031936011261018757602090517f189ab7a9244df0848122154315af71fe140f3db0fe014031783b0946b8c9d2e38152f35b5080fd5b5034610187578160031936011261018757602090516000805160206115f48339815191528152f35b9050346104b357602091826003193601126104af578135906000805160206115f48339815191528086526000805160206116148339815191528552818620338752855260ff828720541615610491575084821315610441576305f5e10082126103f45764e8d4a5100082136103a757600154603c81018091116103945742106103475760025480610298575b85548387554260015593600019821461028557506001016002555142815233937f33c5e5fbc2ba0c59c5a511e2cd184f7c984c48edc3a154a407b8e4583f98693891a480f35b634e487b7160e01b875260119052602486fd5b855480841315610337576102ac81856110ff565b905b64012a05f20090818102918183051490151715610324576402540be4009005121561023f57815162461bcd60e51b8152808501869052602560248201527f4f7261636c65416461707465723a207072696365206368616e676520746f6f206044820152646c6172676560d81b6064820152608490fd5b634e487b7160e01b885260118652602488fd5b61034184826110ff565b906102ae565b6084939150519162461bcd60e51b8352820152602260248201527f4f7261636c65416461707465723a2075706461746520746f6f206672657175656044820152611b9d60f21b6064820152fd5b634e487b7160e01b865260118452602486fd5b6084939150519162461bcd60e51b8352820152602260248201527f4f7261636c65416461707465723a2070726963652061626f7665206d6178696d604482015261756d60f01b6064820152fd5b6084939150519162461bcd60e51b8352820152602260248201527f4f7261636c65416461707465723a2070726963652062656c6f77206d696e696d604482015261756d60f01b6064820152fd5b6084939150519162461bcd60e51b8352820152602560248201527f4f7261636c65416461707465723a207072696365206d75737420626520706f73604482015264697469766560d81b6064820152fd5b905163e2517d3f60e01b815233818501526024810191909152604490fd5b8380fd5b8280fd5b8383346101875781600319360112610187576001549182159081156104ef575b60609450549282519384526020840152151590820152f35b9050610e10830180841161050957606094504211906104d7565b634e487b7160e01b825260118552602482fd5b919050346104b357806003193601126104b35761056591356105606001610541611015565b9383875260008051602061161483398151915260205286200154611186565b6114ac565b5080f35b8284346105dd57806003193601126105dd57805491600154906002549180151593846105ab575b50608095508151948552602085015283015215156060820152f35b909350610e108401908185116105ca5750608095504211159286610590565b634e487b7160e01b815260118752602490fd5b80fd5b9050346104b35760203660031901126104b3576105fb611030565b907ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a009182549160ff83861c16159267ffffffffffffffff811680159081610799575b600114908161078f575b159081610786575b506107775767ffffffffffffffff198116600117855583610758575b506001600160a01b0382161561070157506106a79061068861152f565b61069061152f565b61069861152f565b6106a181611257565b506112e5565b5064037e11d600845542600155836002556106c0578280f35b805468ff00000000000000001916905551600181527fc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d290602090a138808280f35b608490602086519162461bcd60e51b8352820152602b60248201527f4f7261636c65416461707465723a2061646d696e2063616e6e6f74206265207a60448201526a65726f206164647265737360a81b6064820152fd5b68ffffffffffffffffff1916680100000000000000011784553861066b565b50845163f92ee8a960e01b8152fd5b9050153861064f565b303b159150610647565b85915061063d565b50503461018757816003193601126101875760209051603c8152f35b505034610187578160031936011261018757602090516305f5e1008152f35b5050346101875781600319360112610187578051610819916107fd82611046565b60058252640352e302e360dc1b602083015251918291826110b6565b0390f35b83346105dd5760203660031901126105dd57610837611030565b61083f61112e565b61084881611404565b5033906001600160a01b03167f17d7f044d47e4fae1701f86266d0a674db3f792671bd1b974ace77a09af1c8278380a380f35b50503461018757816003193601126101875751908152602090f35b50503461018757816003193601126101875760209051610e108152f35b905082346105dd57806003193601126105dd5760015491821561095157610e10830180841161093e5742116108f15750549082519182526020820152f35b608490602085519162461bcd60e51b8352820152602160248201527f4f7261636c65416461707465723a207072696365206461746120746f6f206f6c6044820152601960fa1b6064820152fd5b634e487b7160e01b835260118252602483fd5b608490602085519162461bcd60e51b8352820152602660248201527f4f7261636c65416461707465723a206e6f207072696365206461746120617661604482015265696c61626c6560d01b6064820152fd5b9050346104b35760203660031901126104b3576109be611030565b906109c761112e565b6001600160a01b038216928315610a0d5750506109e3906111b9565b5033907f0780dc183feb0e4f9714cd802b3c0a21894b7ccb4172c992569d2acb5d45f91c8380a380f35b906020608492519162461bcd60e51b8352820152602e60248201527f4f7261636c65416461707465723a206f70657261746f722063616e6e6f74206260448201526d65207a65726f206164647265737360901b6064820152fd5b9050346104b357816003193601126104b3578160209360ff92610a88611015565b9035825260008051602061161483398151915286528282206001600160a01b039091168252855220549151911615158152f35b50503461018757816003193601126101875760209060ff7fcd5ed15c6e187e77e9aee88184c21f4f2182ab5827cb3b7e07fbedcd63f03300541690519015158152f35b505034610187578160031936011261018757805161081991610b1f82611046565b60058252640312e302e360dc1b602083015251918291826110b6565b8284346105dd57806003193601126105dd57507f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03163003610ba757602090517f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc8152f35b5163703e46dd60e11b8152fd5b918091506003193601126104b357610bca611030565b90602493843567ffffffffffffffff811161018757366023820112156101875780850135610bf78161109a565b94610c0485519687611078565b81865260209182870193368a8383010111610e76578186928b8693018737880101526001600160a01b037f00000000000000000000000000000000000000000000000000000000000000008116308114908115610e48575b50610e38577f189ab7a9244df0848122154315af71fe140f3db0fe014031783b0946b8c9d2e38086526000805160206116148339815191528452868620338752845260ff878720541615610e1b575081169585516352d1902d60e01b815283818a818b5afa869181610de8575b50610ce5575050505050505191634c9c8ce360e01b8352820152fd5b9088888894938c7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc91828103610dd35750853b15610dbf575080546001600160a01b031916821790558451889392917fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b8580a2825115610da15750506105659582915190845af4913d15610d97573d610d89610d808261109a565b92519283611078565b81528581943d92013e611570565b5060609250611570565b955095505050505034610db357505080f35b63b398979f60e01b8152fd5b8651634c9c8ce360e01b8152808501849052fd5b8751632a87526960e21b815280860191909152fd5b9091508481813d8311610e14575b610e008183611078565b81010312610e1057519038610cc9565b8680fd5b503d610df6565b865163e2517d3f60e01b815233818b0152808b0191909152604490fd5b855163703e46dd60e11b81528890fd5b9050817f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5416141538610c5c565b8580fd5b8383346101875781600319360112610187576001548015159283610ea5575b60208484519015158152f35b90919250610e108201809211610ec5575060209250421115908380610e99565b634e487b7160e01b815260118452602490fd5b838334610187578060031936011261018757610ef2611015565b90336001600160a01b03831603610f0f57506105659192356114ac565b5163334bd91960e11b81528390fd5b919050346104b357806003193601126104b3576105659135610f436001610541611015565b61138f565b9050346104b35760203660031901126104b3578160209360019235815260008051602061161483398151915285522001549051908152f35b5050346101875781600319360112610187576020905164012a05f2008152f35b9050346104b35760203660031901126104b357359063ffffffff60e01b82168092036104b35760209250637965db0b60e01b8214918215610fe5575b50519015158152f35b6301ffc9a760e01b14915038610fdc565b8490346101875781600319360112610187578064e8d4a5100060209252f35b602435906001600160a01b038216820361102b57565b600080fd5b600435906001600160a01b038216820361102b57565b6040810190811067ffffffffffffffff82111761106257604052565b634e487b7160e01b600052604160045260246000fd5b90601f8019910116810190811067ffffffffffffffff82111761106257604052565b67ffffffffffffffff811161106257601f01601f191660200190565b6020808252825181830181905290939260005b8281106110eb57505060409293506000838284010152601f8019910116010190565b8181018601518482016040015285016110c9565b8181039291600013801582851316918412161761111857565b634e487b7160e01b600052601160045260246000fd5b3360009081527fb7db2dd08fcb62d0c9e08c51941cae53c267786a0b75803fb7960902fc8ef97d602052604081205460ff16156111685750565b6044906040519063e2517d3f60e01b82523360048301526024820152fd5b8060005260008051602061161483398151915260205260406000203360005260205260ff60406000205416156111685750565b6001600160a01b031660008181527f448256db8f8fb95ee3eaaf89c1051414494e85cebb6057fcf996cc3d0ccfb45660205260408120549091906000805160206115f4833981519152906000805160206116148339815191529060ff16611251578184526020526040832082845260205260408320600160ff198254161790556000805160206115d4833981519152339380a4600190565b50505090565b6001600160a01b031660008181527fb7db2dd08fcb62d0c9e08c51941cae53c267786a0b75803fb7960902fc8ef97d60205260408120549091906000805160206116148339815191529060ff166112e0578280526020526040822081835260205260408220600160ff1982541617905533916000805160206115d48339815191528180a4600190565b505090565b6001600160a01b031660008181527fab71e3f32666744d246edff3f96e4bdafee2e9867098cdd118a979a7464786a860205260408120549091907f189ab7a9244df0848122154315af71fe140f3db0fe014031783b0946b8c9d2e3906000805160206116148339815191529060ff16611251578184526020526040832082845260205260408320600160ff198254161790556000805160206115d4833981519152339380a4600190565b9060009180835260008051602061161483398151915280602052604084209260018060a01b03169283855260205260ff60408520541615600014611251578184526020526040832082845260205260408320600160ff198254161790556000805160206115d4833981519152339380a4600190565b6001600160a01b031660008181527f448256db8f8fb95ee3eaaf89c1051414494e85cebb6057fcf996cc3d0ccfb45660205260408120549091906000805160206115f4833981519152906000805160206116148339815191529060ff161561125157818452602052604083208284526020526040832060ff1981541690557ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b339380a4600190565b9060009180835260008051602061161483398151915280602052604084209260018060a01b03169283855260205260ff60408520541660001461125157818452602052604083208284526020526040832060ff1981541690557ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b339380a4600190565b60ff7ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a005460401c161561155e57565b604051631afcd79f60e31b8152600490fd5b90611597575080511561158557805190602001fd5b604051630a12f52160e11b8152600490fd5b815115806115ca575b6115a8575090565b604051639996b31560e01b81526001600160a01b039091166004820152602490fd5b50803b156115a056fe2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b92902dd7bc7dec4dceedda775e58dd541e08a116c6c53815c0bd028192f7b626800a264697066735822122034a9a5cf6762ea1c888c26037a716453ce96eef52d76882b9553d069a21797ca64736f6c63430008160033";

type OracleAdapterConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: OracleAdapterConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class OracleAdapter__factory extends ContractFactory {
  constructor(...args: OracleAdapterConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(overrides || {});
  }
  override deploy(overrides?: NonPayableOverrides & { from?: string }) {
    return super.deploy(overrides || {}) as Promise<
      OracleAdapter & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): OracleAdapter__factory {
    return super.connect(runner) as OracleAdapter__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): OracleAdapterInterface {
    return new Interface(_abi) as OracleAdapterInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): OracleAdapter {
    return new Contract(address, _abi, runner) as unknown as OracleAdapter;
  }
}
