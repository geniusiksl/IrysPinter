const { ethers } = require('ethers');

const MARKETPLACE_CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "price",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "ownerOf",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const MARKETPLACE_CONTRACT_ADDRESS = '0x218B055f2984F324fbcCd53d6ceBF6a45b51cf6B';

async function checkNFTStatus(tokenId) {
  try {
    // Подключаемся к Arbitrum
    const provider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    const contract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_ABI, provider);
    
    console.log(`Checking NFT with tokenId: ${tokenId}`);
    
    // Проверяем владельца
    const owner = await contract.ownerOf(tokenId);
    console.log(`Owner: ${owner}`);
    
    // Проверяем цену
    const price = await contract.price(tokenId);
    const priceInEth = ethers.formatEther(price);
    console.log(`Price: ${priceInEth} ETH`);
    
    const isListed = price.gt(0);
    console.log(`Is listed: ${isListed}`);
    
    return {
      tokenId,
      owner,
      price: priceInEth,
      isListed
    };
  } catch (error) {
    console.error('Error checking NFT status:', error);
    return null;
  }
}

// Проверяем несколько NFT
async function main() {
  const tokenIds = [1, 2, 3, 4, 5];
  
  for (const tokenId of tokenIds) {
    console.log(`\n--- Checking NFT ${tokenId} ---`);
    const status = await checkNFTStatus(tokenId);
    if (status) {
      console.log('Status:', status);
    }
  }
}

main().catch(console.error); 