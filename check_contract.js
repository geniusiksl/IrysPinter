const { ethers } = require('ethers');

// ABI для проверки контракта
const CONTRACT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)"
];

const CONTRACT_ADDRESS = '0xd8b934580fcE35a11B58C6D73aDeE468a2833fa8';

async function checkContract() {
  try {
    // Подключаемся к Arbitrum
    const provider = new ethers.providers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    
    console.log('Checking contract on Arbitrum...');
    console.log('Contract address:', CONTRACT_ADDRESS);
    
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    // Проверяем базовую информацию
    try {
      const name = await contract.name();
      const symbol = await contract.symbol();
      console.log('✅ Contract found!');
      console.log('Name:', name);
      console.log('Symbol:', symbol);
    } catch (error) {
      console.log('❌ Contract not found or not accessible');
      console.log('Error:', error.message);
      return;
    }
    
    // Проверяем код контракта
    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === '0x') {
      console.log('❌ No contract code at this address');
      return;
    }
    
    console.log('✅ Contract code exists');
    
  } catch (error) {
    console.error('Error checking contract:', error);
  }
}

checkContract(); 