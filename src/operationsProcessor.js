const sleep = require('../utils/sleep');

class OperationsProcessor {
  constructor(queue, accounts) {
    this.queue = queue;
    this.accounts = this.filterAccounts(accounts);
    this.historic = {};
  }

  async start(interval=1000) {
  
    while(true) {
      const operations = this.queue.getBatch();
      this.processOperations(operations);
      await sleep(interval);
    }
  }

  processOperations(operations) {
    
    for(const operation of operations){
      this.operationManager(operation);

    }
  }

  filterAccounts(accounts){
    const hash = {};
    for( const account of accounts ){
      hash[`${account.account}-${account.agency}`] = account;
    }

    return hash;
  }

  operationManager(operation){
    console.log(`---------------------------`);
    console.log(`Tipo : ${operation.type}\n`);

    const account = this.getAccountFromOperation(operation);

    if(account){
      if( operation.type === "DEPOSIT"){
        const teste = this.deposito(account, operation.quantity);
        if( teste ){
          this.historic[`${operation.operationId}`] = operation;
        }
      }
      
      if( operation.type === "WITHDRAW"){
        const teste = this.saque(account, operation.quantity);
        if( teste ){
          this.historic[`${operation.operationId}`] = operation;
        }
      }
      
      if( operation.type === "TRANSFER"){
        const {from, to} = this.getAccountFromTransfer(operation);
        const teste  = this.transferencia(from, to, operation.quantity);

        if( teste ){
          this.historic[`${operation.operationId}`] = operation;
        }
      }
    

      if( operation.type === "CANCEL"){
        const teste = this.cancel(operation);
        
        if( teste ){
          delete this.historic[`${operation.operation.operationId}`]
        }
      }
    }

    if( operation.type === "HISTORIC"){
      console.log(`Quantia de operações: ${Object.keys(this.historic).length}`)
      for(const operations in this.historic){

        console.log(`\n${operations}:`);
        for( const data in this.historic[operations] ){
          console.log(`${data}: ${this.historic[operations][data]}`)
        }
        console.log("\n");
      }
      this.historic[`${operation.operationId}`] = operation;
    }

    return;
  }

  getAccountFromTransfer(operation){
    const from = this.getAccount(operation.from.account, operation.from.agency);
    const to = this.getAccount(operation.to.account, operation.to.agency);

    return { from, to };
  }

  getAccountFromOperation(operation){
    if( operation.type === "TRANSFER" ){
      return this.getAccount(operation.from.account, operation.from.agency);
    }

    return this.getAccount(operation.account, operation.agency);
  }

  getAccount(account, agency){
    return this.accounts[`${account}-${agency}`];
  }

  saque(account, quantity){
    console.log("\nFazendo um saque");
    console.log(`Saldo antigo : ${account.balance}`);

    if((account.balance - quantity) < 0){
      console.log(`Saldo insuficiente`);
      console.log(`Saldo atual : ${account.balance}\n`);
      return;

    }else{
      console.log(`Valor sacado : ${quantity}`);
      account.balance -= quantity;
      console.log(`Saldo atual : ${account.balance}\n`);
    }

    return account;
  }

  deposito(account, quantity){
    console.log("\nFazendo um depósito");
    console.log(`Saldo antigo : ${account.balance}`);
    console.log(`Valor depositado : ${quantity}`);
    account.balance += quantity;
    console.log(`Saldo novo : ${account.balance}\n`);

    return account;
  }

  transferencia(from, to, quantity){
    console.log("\nFazendo uma transferência");
          
    if(!to){
      console.log("A conta que recebe é inválida")
      return;
    }
    if(from.balance - quantity < 0){     
      console.log("Saldo em conta é insuficiente");
      console.log(`Saldo atual e quantia a ser enviada : ${from.balance} | ${quantity}`)
      return;
    }

    console.log(`Saldo antigo da conta que envia e recebe : ${from.balance} | ${to.balance}`)

    from.balance -= quantity;
    to.balance += quantity;

    console.log(`Saldo novo da conta que envia e recebe : ${from.balance} | ${to.balance}`)
    return true;
  }
  
  cancel(operation){
    console.log(operation.operation.type)
    if(operation.operation.type === "DEPOSIT"){
      console.log("cancelando um depósito");
      return this.cancelDeposit(operation.operation)
    }

    if(operation.operation.type === "WITHDRAW"){
      console.log("cancelando um saque");
      return this.cancelWithdraw(operation.operation);
    }

    if(operation.operation.type === "TRANSFER"){
     const { from, to} = this.getAccountFromTransfer(operation.operation);
      console.log("cancelando uma transferencia");
      return this.transferencia(to, from, operation.operation.quantity);
    }
  }

  cancelDeposit(operation){
    if( (this.accounts[`${operation.account}-${operation.agency}`].balance - operation.quantity) < 0 ){
      console.log("Saldo insuficiente impossível cancelar o depósito");
      return;
    }

    console.log("Depósito cancelado");
    console.log(`Saldo antes: ${this.accounts[`${operation.account}-${operation.agency}`].balance}`);
    this.accounts[`${operation.account}-${operation.agency}`].balance -= operation.quantity;
    console.log(`Saldo depois: ${this.accounts[`${operation.account}-${operation.agency}`].balance}`);
    return operation.operationId;
  }

  cancelWithdraw(operation){
    console.log(`Saldo antes: ${this.accounts[`${operation.account}-${operation.agency}`].balance}`);
    this.accounts[`${operation.account}-${operation.agency}`].balance += operation.quantity;
    console.log(`Saldo depois: ${this.accounts[`${operation.account}-${operation.agency}`].balance}`);
    return operation.operationId;

  }
}

module.exports = OperationsProcessor;