const 	BigNumber 	= require('bignumber.js'),
		ethUtil 	= require('ethereumjs-util'),
		Web3 		= require('web3'),
		axios 		= require('axios');


class EtherMiumApi {

	constructor()
	{
		// the main API endpoint
		this.apiUrl = 'https://api.ethermium.com';

		// the private key to your wallet
		// if you use this module inside a repository we recommend using a 
		// separate .yaml file to store your private key and adding it
		// to the .gitignore file so that the private key does not end up
		// in unprotected environments
		this.privateKey 	= '...'; 

		// the Ethereum address of your wallet
		this.walletAddress 	= '...';

		// url to the node you wish to connect
		// https://geth.ethermium.com is a node run by EtherMium and can be used in your production environment
		// otherwisde you may use your own node or infura: https://mainnet.infura.io
		this.web3url 		= 'https://geth.ethermium.com'; 

		// the address of the EtherMium contract, make sure it is the latest contract 
		// as there can be multiple contracts and the old ones will not have the full 
		// functionality neither the latest orderbook
		this.contract_address = '0xa5CC679A3528956E8032df4F03756C077C1eE3F4';


		this.lastNonce = 0;
		this.init();
		
	}

	init(privateKey, web3Url = null, contract_address = null)
	{
		this.web3 = new Web3(this.web3url);	
		this.privateKey = privateKey;

		if (contract_address != null)
		{
			this.contract_address = contract_address;
		}

		if (web3Url != null)
		{
			this.web3url = web3Url;
		}
	}




	/**
	 * Get Tickers
	 *
	 * @param {String} quoteAddress Address of the quote token 
	 * @param {String} baseAddress Address of the base token (if HOT/ETH, this should be '0x0000000000000000000000000000000000000000'
	 * @return {TickerList}
	 */
	async getTickers(quoteAddress = null, baseAddress = null)
	{
		try {
			var request = {
				quoteAddress: ethUtil.toChecksumAddress(quoteAddress),
				baseAddress: ethUtil.toChecksumAddress(baseAddress)
			}

			const resp = await axios.get(this.apiUrl+'/v1/tokenTickers', request);
			return resp.data.data;	
		}
		catch (error)
		{
			console.error(`[EtherMium.getTickers] Error=${error.message}`);
			return false;
		}
	}


	/**
	 * Get Token Order Book
	 *
	 * @param {String} quoteAddress Address of the quote token 
	 * @param {String} baseAddress Address of the base token (if HOT/ETH, this should be '0x0000000000000000000000000000000000000000')
	 * @param {Int} limit Number of orders to be returned per side
	 * @return {TokenOrderBookResponse}
	 */
	async getTokenOrderBook(quoteAddress, baseAddress, limit = 100)
	{
		try {
			var request = {
				contractAddress: ethUtil.toChecksumAddress(this.contract_address),
				quoteAddress: ethUtil.toChecksumAddress(quoteAddress),
				baseAddress: ethUtil.toChecksumAddress(baseAddress),
				limit: limit
			}

			const resp = await axios.get(this.apiUrl+'/v1/tokenOrderBook', request);
			return resp.data.data;	
		}
		catch (error)
		{
			console.error(`[EtherMium.getTokenOrderBook] Error=${error.message}`);
			return false;
		}
	}


	/**
	 * Get My Token Orders
	 *
	 * @param {String} token_address Address of the quote token 
	 * @return {TokenOrderList}
	 */
	async getMyTokenOrders(token_address = null)
	{
		try {
			var request = {
				contract_address: ethUtil.toChecksumAddress(this.contract_address),
				user_address: ethUtil.toChecksumAddress(this.walletAddress)				
			}

			if (token_address != null)
			{
				request.quoteAddress = ethUtil.toChecksumAddress(token_address);
			}

			const resp = await axios.get(this.apiUrl+'/v1/myTokenOrders', request);
			return resp.data.data;	
		}
		catch (error)
		{
			console.error(`[EtherMium.getMyTokenOrders] Error=${error.message}`);
			return false;
		}
	}


	/**
	 * Get My Balance
	 *
	 * @param {String} token_address Address of the quote token 
	 * @return {TokenOrderList}
	 */
	async getMyBalance(token_address = null)
	{
		try {
			var request = {
				contract_address: ethUtil.toChecksumAddress(this.contract_address),
				user_address: ethUtil.toChecksumAddress(this.walletAddress)				
			}

			if (token_address != null)
			{
				request.token_address = ethUtil.toChecksumAddress(token_address);
			}

			const resp = await axios.get(this.apiUrl+'/v1/myBalance', request);
			return resp.data.data;	
		}
		catch (error)
		{
			console.error(`[EtherMium.getMyBalance] Error=${error.message}`);
			return false;
		}
	}


	/**
	 * Get My Token Trades
	 *
	 * @param {String} token_address Address of the quote token 
	 * @param {Bool} is_confirmed Return trades confirmed on the blockchain 
	 * @param {Bool} is_pending Return trades that are not yet confirmed on the blockchain 
	 * @return {TokenTradeList}
	 */
	async getMyTokenTrades(token_address = null, is_confirmed = null, is_pending = null)
	{
		try {
			var request = {
				contract_address: ethUtil.toChecksumAddress(this.contract_address),
				user_address: ethUtil.toChecksumAddress(this.walletAddress)				
			}

			if (token_address != null)
			{
				request.token_address = ethUtil.toChecksumAddress(token_address);
			}

			if (is_confirmed != null)
			{
				request.is_confirmed = is_confirmed;
			}

			if (is_pending != null)
			{
				request.is_pending = is_pending;
			}

			const resp = await axios.get(this.apiUrl+'/v1/myTokenTrades', request);
			return resp.data.data;	
		}
		catch (error)
		{
			console.error(`[EtherMium.getMyTokenOrders] Error=${error.message}`);
			return false;
		}
	}



	/**
	 * Place Limit Order
	 *
	 * @param {String} side BUY or SELL
	 * @param {String} price Decimal price, (eg. '0.00000575')
	 * @param {String} quantity Decimal adjusted qty (eg. '13345.456')
	 * @param {String} quoteToken Address of the token
	 * @param {Int} quoteTokenDecimals Decimals of the base token
	 * @param {String} baseToken Address of the pair token (if you are trading HOT/ETH, quoteToken=HOT and baseToken=ETH)
	 * @param {Int} baseTokenDecimals Decimals of the quote token
	 * @param {Int} expires The block number when the order will expire (optional)
	 * @return {TokenOrderResponse}
	 */
	async placeLimitOrder(side, price, quantity, quoteToken, quoteTokenDecimals, baseToken, baseTokenDecimals, expires = null)
	{
		try {
			[amountBuy, amountSell] = this.getAmountBuyAndSell(side, price, quantity, quoteTokenDecimals, baseTokenDecimals);

			switch (side)
			{
				case 'BUY':
					var data = {
						tokenGet: ethUtil.toChecksumAddress(quoteToken),
						amountGet: amountBuy,
						tokenGive: ethUtil.toChecksumAddress(baseToken),
						amountGive: amountSell
					}
				break;

				case 'SELL':
					var data = {
						tokenGet: ethUtil.toChecksumAddress(baseToken),
						amountGet: amountBuy,
						tokenGive: ethUtil.toChecksumAddress(quoteToken),
						amountGive: amountSell
					}
				break;
			}

			var orderRequest = this.generateNewOrderRequest(data);
			
			orderRequest.expires = expires;
			
			const resp = await axios.post(this.apiUrl+'/v1/tokenOrder', orderRequest);
			return resp.data.data;	
			
		}
		catch (error)
		{
			console.error(`[EtherMium.placeLimitOrder] Error=${error.message}`);
			return false;
		}
	}

	async cancelTokenOrder(orderHash)
	{
		try {
			var request = this.prepareCancelOrderRequest(orderHash);

			const resp = await axios.post(this.apiUrl+'/v1/cancelTokenOrder', request);
			return resp.data.data;	
		}
		catch (error)
		{
			console.error(`[EtherMium.cancelTokenOrder] Error=${error.message}`);
		}
	}

	async cancelAllTokenOrder(token_addrress = '0x0000000000000000000000000000000000000000')
	{
		try {
			const nonce = this.getNonce();

			const cancelHash = this.createCancelAllTokenOrdersHash(
				ethUtil.toChecksumAddress(this.contract_address),
				ethUtil.toChecksumAddress(this.walletAddress),
				nonce,
				token_address
			);
			const sign = this.sign(cancelHash);

			const request = {
				contract_address: ethUtil.toChecksumAddress(this.contractAddress),
				user_address: ethUtil.toChecksumAddress(this.walletAddress),
				nonce: nonce,
				token_address: ethUtil.toChecksumAddress(token_address),
				v: sign.v,
				r: sign.r,
				s: sign.s,
				cancel_hash: cancelHash
			};

			const resp = await axios.post(this.apiUrl+'/v1/cancelAllTokenOrder', request);
			return resp.data.data;	
		}
		catch (error)
		{
			console.error(`[EtherMium.cancelAllTokenOrder] Error=${error.message}`);
		}
	}


	/**
	 * Withdraw token
	 *
	 * @param {String} token_address The token you wish to withdraw. For ETH use '0x0000000000000000000000000000000000000000'
	 * @param {String} decimals Number of decimals of the token
	 * @param {String} quantity Decimal adjusted amount (eg. '13345.456')
	 * @param {String} gas_price Gas price to set for the withdrawal transaction
	 * @return {WithdrawResultObject}
	 */
	async withdraw(token_address, decimals, quantity, gas_price = null)
	{
		try {
			if (gas_price == null)
			{
				gas_price = await this.getGasPrice('standard');
			}

			var amount = new BigNumber(quantity).times(new BigNumber(10).pow(decimals)).toFixed(0,1);
			var request = this.prepareWithdrawRequest(token_address, amountGive, gas_price);

			const resp = await axios.post(this.apiUrl+'/v1/withdraw', request);
			return resp.data.data;	

		}
		catch (error)
		{
			console.error(`[EtherMium.withdraw] Error=${error.message}`);
		}
	}

	async getGasPrice(level)
	{
		try {
			const resp = await axios.get(this.apiUrl+'/v1/gasPrice');
			return resp.data.data[level];	
		}
		catch (error)
		{
			console.error(`[EtherMium.getGasPrice] Error=${error.message}`);
		}		
	}


	prepareWithdrawRequest(token_address, amount, gas_price)
	{
		try {
			const nonce = this.getNonce();

			const withdrawHash = this.createWithdrawHash(
				ethUtil.toChecksumAddress(this.contract_addrress),
				ethUtil.toChecksumAddress(token_address),
				amount,
				ethUtil.toChecksumAddress(this.walletAddress),
				nonce
			);

			const sign = this.sign(withdrawHash);

			const req = {
				contract_address: ethUtil.toChecksumAddress(this.contract_address),
				token_address: ethUtil.toChecksumAddress(token_address),
				amount: amount,
				user_address: ethUtil.toChecksumAddress(this.walletAddress),
				nonce: nonce,
				v: sign.v,
				r: sign.r,
				s: sign.s,
				withdraw_hash: withdrawHash,
				gas_price: gas_price+''
			};

			return req;
		}
		catch (error)
		{
			console.error(`[EtherMium.withdraw] Error=${error.message}`);
		}
	}

	prepareCancelOrderRequest(orderHash)
	{
		try
		{
			const nonce = this.getNonce();

			const cancelHash = this.createCancelOrderHash(
				ethUtil.toChecksumAddress(this.contract_address),
				orderHash,
				ethUtil.toChecksumAddress(this.walletAddress),
				nonce
			);
			const sign = this.sign(cancelHash);

			const req = {
				contract_address: ethUtil.toChecksumAddress(this.contract_address),
				order_hash: orderHash,
				user_address: ethUtil.toChecksumAddress(this.walletAddress),
				nonce: nonce,
				v: sign.v,
				r: sign.r,
				s: sign.s,
				cancel_hash: cancelHash
			};
			return req;
		}
		catch (error)
		{
			console.error(`[EtherMium.prepareCancelOrderRequest] Error=${error.message}`);
		}
		
	}

	getNonce()
	{
		return new Date()/1 + ++this.lastNonce;
	}




	/**
	 * Generate new order request
	 *
	 * @param {Object} data Order data
	 * @return {TokenOrderRequest}
	 */
	generateNewOrderRequest(data)
	{
		try {
			const nonce = this.getNonce(),
				contractAddr = ethUtil.toChecksumAddress(this.contract_address);

			const user_address = ethUtil.toChecksumAddress(this.walletAddress);

			const orderHash = this.createOrderHash(
				ethUtil.toChecksumAddress(data.tokenGet),
				data.amountGet,
				ethUtil.toChecksumAddress(data.tokenGive),
				data.amountGive,
				nonce,
				user_address
			);

			const sign = this.sign(orderHash);

			var req = {
				contract_address: contractAddr,
				token_buy_address: ethUtil.toChecksumAddress(data.tokenGet),
				amount_buy: data.amountGet,
				token_sell_address: ethUtil.toChecksumAddress(data.tokenGive),
				amount_sell: data.amountGive,
				nonce: nonce,
				user_address: user_address,
				v: sign.v,
				r: sign.r,
				s: sign.s,
				order_hash: orderHash
			};

			return req;
		}
		catch (error)
		{
			console.error(`[EtherMium.generateNewOrderRequest] Error=${error.message}`);
			return false;
		}
	}



	// converts order price and qunatity to amountBuy and amountSell values that are used to place orders
	getAmountBuyAndSell(side, price, quantity, quoteTokenDecimals, baseTokenDecimals)
	{
		try {
			switch (side)
			{
				case 'BUY':
					return [
						new BigNumber(quantity).times(new BigNumber(10).pow(quoteTokenDecimals)).toFixed(0,1),
						new BigNumber(quantity).times(new BigNumber(price)).times(new BigNumber(10).pow(baseTokenDecimals)).toFixed(0,0),
					]
				break;
				case 'SELL':
					return [
						new BigNumber(quantity).div(new BigNumber(price)).times(new BigNumber(10).pow(baseTokenDecimals)).toFixed(0,1),
						new BigNumber(quantity).times(new BigNumber(10).pow(quoteTokenDecimals)).toFixed(0,0)
					]
				break;
			}
		}
		catch (error)
		{
			console.error(`[EtherMium.getAmountBuyAndSell] Error=${error.message}`);
			return false;
		}
		
	}

	// signs the given hash with your private key
	sign(hash) {
		try 
		{
			const privateKeyBuf = Buffer.from(this.privateKey, 'hex'),
				hashBuf = ethUtil.toBuffer(hash),
				prefixedHashBuf = ethUtil.hashPersonalMessage(hashBuf);

			const sign = ethUtil.ecsign(prefixedHashBuf, privateKeyBuf);

			return {
				v: sign.v,
				r: ethUtil.bufferToHex(sign.r),
				s: ethUtil.bufferToHex(sign.s)
			};
		}
		catch (error)
		{
			console.error(`Error signing hash: ${error.message}`);
		}

	}

	// generates the order hash
	createOrderHash(contract_address, token_buy_address, amount_buy, token_sell_address, amount_sell, nonce, user_address) {
		return this.web3.utils.soliditySha3(
			{type: 'address', value: ethUtil.toChecksumAddress(contract_address)},
			{type: 'uint160', value: ethUtil.toChecksumAddress(token_buy_address)},
			{type: 'uint256', value: amount_buy},
			{type: 'uint160', value: ethUtil.toChecksumAddress(token_sell_address)},
			{type: 'uint256', value: amount_sell},
			{type: 'uint256', value: nonce},
			{type: 'address', value: ethUtil.toChecksumAddress(user_address)}
		);
	}


	// generates the cancel hash
	createCancelOrderHash(contract_address, order_hash, user_address, nonce) {
		try {
			return this.web3.utils.soliditySha3(
				{type: 'address', value: ethUtil.toChecksumAddress(contract_address)},
				{type: 'bytes32', value: order_hash},
				{type: 'address', value: ethUtil.toChecksumAddress(user_address)},
				{type: 'uint256', value: nonce}
			);
		}
		catch (error)
		{
			console.error(`Error signing hash: ${error.message}`);
		}
	}

	createCancelAllTokenOrdersHash(contract_address, user_address, nonce, token_address = '0x0000000000000000000000000000000000000000') {
		try {
			return this.web3.utils.soliditySha3(
			  	{type: 'address', value: ethUtil.toChecksumAddress(contract_address)},      
			  	{type: 'address', value: ethUtil.toChecksumAddress(user_address)},
			  	{type: 'uint256', value: nonce}
			  	{type: 'address', value: ethUtil.toChecksumAddress(token_address)}
			);
		}
		catch (error)
		{
			console.error(`Error signing hash: ${error.message}`);
		}
	}

	// generates the withdraw hash
	createWithdrawHash(contract_address, token_address, amount, user_address, nonce) {
		return this.web3.utils.soliditySha3(
			{type: 'address', value: ethUtil.toChecksumAddress(contract_address)},
			{type: 'uint160', value: ethUtil.toChecksumAddress(token_address)},
			{type: 'uint256', value: amount},
			{type: 'address', value: ethUtil.toChecksumAddress(user_address)},
			{type: 'uint256', value: nonce}
		);
	}



	async getCurrentBlockNumber()
	{
		try {
			let self = this;

			return new Promise(resolve => {
				setTimeout(() => { resolve(false) }, 30e3);
				try {
					web3.eth.getBlockNumber().then((val) => {
						resolve(val);
					});	
				}
				catch (error)
				{
					cons.error(`[getCurrentBlockNumber] Error=${error.message}`);
					resolve(false);
				}				
			});
		}
		catch (error)
		{
			cons.error(`[getCurrentBlockNumber] Error=${error.message}`);
			return false;
		}
	}
	


}

module.exports = new EtherMiumApi();