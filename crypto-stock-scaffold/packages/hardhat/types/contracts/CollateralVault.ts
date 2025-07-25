/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "../common";

export interface CollateralVaultInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "DEFAULT_ADMIN_ROLE"
      | "EMERGENCY_ROLE"
      | "PAUSER_ROLE"
      | "SYNTHETIC_STOCK_ROLE"
      | "depositCollateral"
      | "emergencyTokenRecovery"
      | "emergencyWithdrawalDelay"
      | "executeEmergencyWithdrawal"
      | "getRoleAdmin"
      | "getTotalCollateral"
      | "getUserCollateral"
      | "getVaultBalance"
      | "grantRole"
      | "hasInitiatedEmergencyWithdrawal"
      | "hasRole"
      | "initiateEmergencyWithdrawal"
      | "isVaultSolvent"
      | "pause"
      | "paused"
      | "renounceRole"
      | "revokeRole"
      | "supportsInterface"
      | "unpause"
      | "usdcToken"
      | "withdrawCollateral"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic:
      | "CollateralDeposited"
      | "CollateralWithdrawn"
      | "EmergencyWithdrawalExecuted"
      | "EmergencyWithdrawalInitiated"
      | "Paused"
      | "RoleAdminChanged"
      | "RoleGranted"
      | "RoleRevoked"
      | "Unpaused"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "DEFAULT_ADMIN_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "EMERGENCY_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "PAUSER_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "SYNTHETIC_STOCK_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "depositCollateral",
    values: [AddressLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "emergencyTokenRecovery",
    values: [AddressLike, BigNumberish, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "emergencyWithdrawalDelay",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "executeEmergencyWithdrawal",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getRoleAdmin",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getTotalCollateral",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getUserCollateral",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getVaultBalance",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "grantRole",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "hasInitiatedEmergencyWithdrawal",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "hasRole",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "initiateEmergencyWithdrawal",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "isVaultSolvent",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "pause", values?: undefined): string;
  encodeFunctionData(functionFragment: "paused", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "renounceRole",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "revokeRole",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "supportsInterface",
    values: [BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "unpause", values?: undefined): string;
  encodeFunctionData(functionFragment: "usdcToken", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "withdrawCollateral",
    values: [AddressLike, BigNumberish, AddressLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "DEFAULT_ADMIN_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "EMERGENCY_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "PAUSER_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "SYNTHETIC_STOCK_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "depositCollateral",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "emergencyTokenRecovery",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "emergencyWithdrawalDelay",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "executeEmergencyWithdrawal",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getRoleAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getTotalCollateral",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getUserCollateral",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getVaultBalance",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "grantRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "hasInitiatedEmergencyWithdrawal",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "hasRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "initiateEmergencyWithdrawal",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isVaultSolvent",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "pause", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "paused", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "renounceRole",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "revokeRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "supportsInterface",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "unpause", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "usdcToken", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "withdrawCollateral",
    data: BytesLike
  ): Result;
}

export namespace CollateralDepositedEvent {
  export type InputTuple = [
    user: AddressLike,
    amount: BigNumberish,
    totalCollateral: BigNumberish
  ];
  export type OutputTuple = [
    user: string,
    amount: bigint,
    totalCollateral: bigint
  ];
  export interface OutputObject {
    user: string;
    amount: bigint;
    totalCollateral: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace CollateralWithdrawnEvent {
  export type InputTuple = [
    user: AddressLike,
    amount: BigNumberish,
    totalCollateral: BigNumberish
  ];
  export type OutputTuple = [
    user: string,
    amount: bigint,
    totalCollateral: bigint
  ];
  export interface OutputObject {
    user: string;
    amount: bigint;
    totalCollateral: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace EmergencyWithdrawalExecutedEvent {
  export type InputTuple = [user: AddressLike, amount: BigNumberish];
  export type OutputTuple = [user: string, amount: bigint];
  export interface OutputObject {
    user: string;
    amount: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace EmergencyWithdrawalInitiatedEvent {
  export type InputTuple = [user: AddressLike, timestamp: BigNumberish];
  export type OutputTuple = [user: string, timestamp: bigint];
  export interface OutputObject {
    user: string;
    timestamp: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace PausedEvent {
  export type InputTuple = [account: AddressLike];
  export type OutputTuple = [account: string];
  export interface OutputObject {
    account: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace RoleAdminChangedEvent {
  export type InputTuple = [
    role: BytesLike,
    previousAdminRole: BytesLike,
    newAdminRole: BytesLike
  ];
  export type OutputTuple = [
    role: string,
    previousAdminRole: string,
    newAdminRole: string
  ];
  export interface OutputObject {
    role: string;
    previousAdminRole: string;
    newAdminRole: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace RoleGrantedEvent {
  export type InputTuple = [
    role: BytesLike,
    account: AddressLike,
    sender: AddressLike
  ];
  export type OutputTuple = [role: string, account: string, sender: string];
  export interface OutputObject {
    role: string;
    account: string;
    sender: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace RoleRevokedEvent {
  export type InputTuple = [
    role: BytesLike,
    account: AddressLike,
    sender: AddressLike
  ];
  export type OutputTuple = [role: string, account: string, sender: string];
  export interface OutputObject {
    role: string;
    account: string;
    sender: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace UnpausedEvent {
  export type InputTuple = [account: AddressLike];
  export type OutputTuple = [account: string];
  export interface OutputObject {
    account: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface CollateralVault extends BaseContract {
  connect(runner?: ContractRunner | null): CollateralVault;
  waitForDeployment(): Promise<this>;

  interface: CollateralVaultInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  DEFAULT_ADMIN_ROLE: TypedContractMethod<[], [string], "view">;

  EMERGENCY_ROLE: TypedContractMethod<[], [string], "view">;

  PAUSER_ROLE: TypedContractMethod<[], [string], "view">;

  SYNTHETIC_STOCK_ROLE: TypedContractMethod<[], [string], "view">;

  depositCollateral: TypedContractMethod<
    [user: AddressLike, amount: BigNumberish],
    [void],
    "nonpayable"
  >;

  emergencyTokenRecovery: TypedContractMethod<
    [token: AddressLike, amount: BigNumberish, recipient: AddressLike],
    [void],
    "nonpayable"
  >;

  emergencyWithdrawalDelay: TypedContractMethod<[], [bigint], "view">;

  executeEmergencyWithdrawal: TypedContractMethod<[], [void], "nonpayable">;

  getRoleAdmin: TypedContractMethod<[role: BytesLike], [string], "view">;

  getTotalCollateral: TypedContractMethod<[], [bigint], "view">;

  getUserCollateral: TypedContractMethod<[user: AddressLike], [bigint], "view">;

  getVaultBalance: TypedContractMethod<[], [bigint], "view">;

  grantRole: TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [void],
    "nonpayable"
  >;

  hasInitiatedEmergencyWithdrawal: TypedContractMethod<
    [user: AddressLike],
    [boolean],
    "view"
  >;

  hasRole: TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [boolean],
    "view"
  >;

  initiateEmergencyWithdrawal: TypedContractMethod<[], [void], "nonpayable">;

  isVaultSolvent: TypedContractMethod<[], [boolean], "view">;

  pause: TypedContractMethod<[], [void], "nonpayable">;

  paused: TypedContractMethod<[], [boolean], "view">;

  renounceRole: TypedContractMethod<
    [role: BytesLike, callerConfirmation: AddressLike],
    [void],
    "nonpayable"
  >;

  revokeRole: TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [void],
    "nonpayable"
  >;

  supportsInterface: TypedContractMethod<
    [interfaceId: BytesLike],
    [boolean],
    "view"
  >;

  unpause: TypedContractMethod<[], [void], "nonpayable">;

  usdcToken: TypedContractMethod<[], [string], "view">;

  withdrawCollateral: TypedContractMethod<
    [user: AddressLike, amount: BigNumberish, recipient: AddressLike],
    [void],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "DEFAULT_ADMIN_ROLE"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "EMERGENCY_ROLE"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "PAUSER_ROLE"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "SYNTHETIC_STOCK_ROLE"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "depositCollateral"
  ): TypedContractMethod<
    [user: AddressLike, amount: BigNumberish],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "emergencyTokenRecovery"
  ): TypedContractMethod<
    [token: AddressLike, amount: BigNumberish, recipient: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "emergencyWithdrawalDelay"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "executeEmergencyWithdrawal"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "getRoleAdmin"
  ): TypedContractMethod<[role: BytesLike], [string], "view">;
  getFunction(
    nameOrSignature: "getTotalCollateral"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "getUserCollateral"
  ): TypedContractMethod<[user: AddressLike], [bigint], "view">;
  getFunction(
    nameOrSignature: "getVaultBalance"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "grantRole"
  ): TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "hasInitiatedEmergencyWithdrawal"
  ): TypedContractMethod<[user: AddressLike], [boolean], "view">;
  getFunction(
    nameOrSignature: "hasRole"
  ): TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [boolean],
    "view"
  >;
  getFunction(
    nameOrSignature: "initiateEmergencyWithdrawal"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "isVaultSolvent"
  ): TypedContractMethod<[], [boolean], "view">;
  getFunction(
    nameOrSignature: "pause"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "paused"
  ): TypedContractMethod<[], [boolean], "view">;
  getFunction(
    nameOrSignature: "renounceRole"
  ): TypedContractMethod<
    [role: BytesLike, callerConfirmation: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "revokeRole"
  ): TypedContractMethod<
    [role: BytesLike, account: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "supportsInterface"
  ): TypedContractMethod<[interfaceId: BytesLike], [boolean], "view">;
  getFunction(
    nameOrSignature: "unpause"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "usdcToken"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "withdrawCollateral"
  ): TypedContractMethod<
    [user: AddressLike, amount: BigNumberish, recipient: AddressLike],
    [void],
    "nonpayable"
  >;

  getEvent(
    key: "CollateralDeposited"
  ): TypedContractEvent<
    CollateralDepositedEvent.InputTuple,
    CollateralDepositedEvent.OutputTuple,
    CollateralDepositedEvent.OutputObject
  >;
  getEvent(
    key: "CollateralWithdrawn"
  ): TypedContractEvent<
    CollateralWithdrawnEvent.InputTuple,
    CollateralWithdrawnEvent.OutputTuple,
    CollateralWithdrawnEvent.OutputObject
  >;
  getEvent(
    key: "EmergencyWithdrawalExecuted"
  ): TypedContractEvent<
    EmergencyWithdrawalExecutedEvent.InputTuple,
    EmergencyWithdrawalExecutedEvent.OutputTuple,
    EmergencyWithdrawalExecutedEvent.OutputObject
  >;
  getEvent(
    key: "EmergencyWithdrawalInitiated"
  ): TypedContractEvent<
    EmergencyWithdrawalInitiatedEvent.InputTuple,
    EmergencyWithdrawalInitiatedEvent.OutputTuple,
    EmergencyWithdrawalInitiatedEvent.OutputObject
  >;
  getEvent(
    key: "Paused"
  ): TypedContractEvent<
    PausedEvent.InputTuple,
    PausedEvent.OutputTuple,
    PausedEvent.OutputObject
  >;
  getEvent(
    key: "RoleAdminChanged"
  ): TypedContractEvent<
    RoleAdminChangedEvent.InputTuple,
    RoleAdminChangedEvent.OutputTuple,
    RoleAdminChangedEvent.OutputObject
  >;
  getEvent(
    key: "RoleGranted"
  ): TypedContractEvent<
    RoleGrantedEvent.InputTuple,
    RoleGrantedEvent.OutputTuple,
    RoleGrantedEvent.OutputObject
  >;
  getEvent(
    key: "RoleRevoked"
  ): TypedContractEvent<
    RoleRevokedEvent.InputTuple,
    RoleRevokedEvent.OutputTuple,
    RoleRevokedEvent.OutputObject
  >;
  getEvent(
    key: "Unpaused"
  ): TypedContractEvent<
    UnpausedEvent.InputTuple,
    UnpausedEvent.OutputTuple,
    UnpausedEvent.OutputObject
  >;

  filters: {
    "CollateralDeposited(address,uint256,uint256)": TypedContractEvent<
      CollateralDepositedEvent.InputTuple,
      CollateralDepositedEvent.OutputTuple,
      CollateralDepositedEvent.OutputObject
    >;
    CollateralDeposited: TypedContractEvent<
      CollateralDepositedEvent.InputTuple,
      CollateralDepositedEvent.OutputTuple,
      CollateralDepositedEvent.OutputObject
    >;

    "CollateralWithdrawn(address,uint256,uint256)": TypedContractEvent<
      CollateralWithdrawnEvent.InputTuple,
      CollateralWithdrawnEvent.OutputTuple,
      CollateralWithdrawnEvent.OutputObject
    >;
    CollateralWithdrawn: TypedContractEvent<
      CollateralWithdrawnEvent.InputTuple,
      CollateralWithdrawnEvent.OutputTuple,
      CollateralWithdrawnEvent.OutputObject
    >;

    "EmergencyWithdrawalExecuted(address,uint256)": TypedContractEvent<
      EmergencyWithdrawalExecutedEvent.InputTuple,
      EmergencyWithdrawalExecutedEvent.OutputTuple,
      EmergencyWithdrawalExecutedEvent.OutputObject
    >;
    EmergencyWithdrawalExecuted: TypedContractEvent<
      EmergencyWithdrawalExecutedEvent.InputTuple,
      EmergencyWithdrawalExecutedEvent.OutputTuple,
      EmergencyWithdrawalExecutedEvent.OutputObject
    >;

    "EmergencyWithdrawalInitiated(address,uint256)": TypedContractEvent<
      EmergencyWithdrawalInitiatedEvent.InputTuple,
      EmergencyWithdrawalInitiatedEvent.OutputTuple,
      EmergencyWithdrawalInitiatedEvent.OutputObject
    >;
    EmergencyWithdrawalInitiated: TypedContractEvent<
      EmergencyWithdrawalInitiatedEvent.InputTuple,
      EmergencyWithdrawalInitiatedEvent.OutputTuple,
      EmergencyWithdrawalInitiatedEvent.OutputObject
    >;

    "Paused(address)": TypedContractEvent<
      PausedEvent.InputTuple,
      PausedEvent.OutputTuple,
      PausedEvent.OutputObject
    >;
    Paused: TypedContractEvent<
      PausedEvent.InputTuple,
      PausedEvent.OutputTuple,
      PausedEvent.OutputObject
    >;

    "RoleAdminChanged(bytes32,bytes32,bytes32)": TypedContractEvent<
      RoleAdminChangedEvent.InputTuple,
      RoleAdminChangedEvent.OutputTuple,
      RoleAdminChangedEvent.OutputObject
    >;
    RoleAdminChanged: TypedContractEvent<
      RoleAdminChangedEvent.InputTuple,
      RoleAdminChangedEvent.OutputTuple,
      RoleAdminChangedEvent.OutputObject
    >;

    "RoleGranted(bytes32,address,address)": TypedContractEvent<
      RoleGrantedEvent.InputTuple,
      RoleGrantedEvent.OutputTuple,
      RoleGrantedEvent.OutputObject
    >;
    RoleGranted: TypedContractEvent<
      RoleGrantedEvent.InputTuple,
      RoleGrantedEvent.OutputTuple,
      RoleGrantedEvent.OutputObject
    >;

    "RoleRevoked(bytes32,address,address)": TypedContractEvent<
      RoleRevokedEvent.InputTuple,
      RoleRevokedEvent.OutputTuple,
      RoleRevokedEvent.OutputObject
    >;
    RoleRevoked: TypedContractEvent<
      RoleRevokedEvent.InputTuple,
      RoleRevokedEvent.OutputTuple,
      RoleRevokedEvent.OutputObject
    >;

    "Unpaused(address)": TypedContractEvent<
      UnpausedEvent.InputTuple,
      UnpausedEvent.OutputTuple,
      UnpausedEvent.OutputObject
    >;
    Unpaused: TypedContractEvent<
      UnpausedEvent.InputTuple,
      UnpausedEvent.OutputTuple,
      UnpausedEvent.OutputObject
    >;
  };
}
