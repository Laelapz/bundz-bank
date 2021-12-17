const sleep = require('../utils/sleep');

class OperationsProcessor {
  constructor(queue, accounts) {
    this.queue = queue;
    this.accounts = this.filterAccounts(accounts);
    this.historic = [];
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
        return this.deposito(account, operation.quantity);
      }
      
      if( operation.type === "WITHDRAW"){
        return this.saque(account, operation.quantity);
        // this.historic.push(operation)
      }
      
      if( operation.type === "TRANSFER"){
        const {from, to} = this.getAccountFromTransfer(operation);
        return this.transferencia(from, to, operation.quantity);
      }
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
  }
  
  cancel(operation, temp){
    console.log(operation.operation.type)
    if(operation.operation.type === "DEPOSIT"){
      console.log("cancelando um depósito");
    }
    else if(operation.operation.type === "WITHDRAW"){
      console.log("cancelando um saque");
    }
    else if(operation.operation.type === "TRANSFER"){
      console.log("cancelando uma transferencia");
    }
  }
}

module.exports = OperationsProcessor;