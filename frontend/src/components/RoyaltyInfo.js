import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const BACKEND_URL = "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

const RoyaltyInfo = () => {
  const [royaltyBalance, setRoyaltyBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');

  useEffect(() => {
    fetchRoyaltyBalance();
  }, []);

  const fetchRoyaltyBalance = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/royalty/balance`);
      setRoyaltyBalance(response.data);
    } catch (error) {
      console.error('Error fetching royalty balance:', error);
      toast.error('Failed to fetch royalty balance');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    if (!withdrawAddress) {
      toast.error('Please enter destination address');
      return;
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter valid amount');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API}/royalty/withdraw`, {
        to_address: withdrawAddress,
        amount: parseFloat(withdrawAmount)
      });

      toast.success(`Withdrew ${withdrawAmount} SOL successfully!`);
      setWithdrawAmount('');
      setWithdrawAddress('');
      fetchRoyaltyBalance(); // Refresh balance
    } catch (error) {
      console.error('Error withdrawing royalties:', error);
      toast.error(error.response?.data?.detail || 'Failed to withdraw royalties');
    } finally {
      setLoading(false);
    }
  };

  const calculateRoyalty = async (saleAmount) => {
    try {
      const response = await axios.post(`${API}/royalty/calculate`, {
        sale_amount: saleAmount
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating royalty:', error);
      return null;
    }
  };

  if (loading && !royaltyBalance) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        💰 Royalty Information
      </h3>

      {royaltyBalance ? (
        <div className="space-y-4">
          {/* Current Balance */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Current Balance</p>
                <p className="text-2xl font-bold text-green-800">
                  {royaltyBalance.balance?.toFixed(4) || '0.0000'} SOL
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-600">Royalty Rate</p>
                <p className="text-lg font-semibold text-green-800">
                  {royaltyBalance.royalty_percentage}%
                </p>
              </div>
            </div>
          </div>

          {/* Royalty Wallet */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-medium mb-2">Royalty Wallet</p>
            <p className="text-sm font-mono text-gray-800 break-all">
              {royaltyBalance.royalty_wallet || 'Not configured'}
            </p>
          </div>

          {/* Withdraw Form */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Withdraw Royalties</h4>
            <form onSubmit={handleWithdraw} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination Address
                </label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter Solana address"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (SOL)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  max={royaltyBalance.balance || 0}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.0"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available: {royaltyBalance.balance?.toFixed(4) || '0.0000'} SOL
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !royaltyBalance.balance || royaltyBalance.balance <= 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Processing...' : 'Withdraw Royalties'}
              </button>
            </form>
          </div>

          {/* Royalty Calculator */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Royalty Calculator</h4>
            <RoyaltyCalculator calculateRoyalty={calculateRoyalty} />
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No royalty information available</p>
        </div>
      )}
    </div>
  );
};

// Royalty Calculator Component
const RoyaltyCalculator = ({ calculateRoyalty }) => {
  const [saleAmount, setSaleAmount] = useState('');
  const [calculation, setCalculation] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = async () => {
    if (!saleAmount || parseFloat(saleAmount) <= 0) {
      toast.error('Please enter valid sale amount');
      return;
    }

    setCalculating(true);
    const result = await calculateRoyalty(parseFloat(saleAmount));
    setCalculation(result);
    setCalculating(false);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sale Amount (SOL)
        </label>
        <div className="flex space-x-2">
          <input
            type="number"
            step="0.001"
            min="0"
            value={saleAmount}
            onChange={(e) => setSaleAmount(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="1.0"
          />
          <button
            onClick={handleCalculate}
            disabled={calculating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            {calculating ? '...' : 'Calculate'}
          </button>
        </div>
      </div>

      {calculation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-blue-600 font-medium">Total Sale:</p>
              <p className="text-blue-800 font-semibold">{calculation.total_amount} SOL</p>
            </div>
            <div>
              <p className="text-blue-600 font-medium">Royalty ({calculation.royalty_percentage}%):</p>
              <p className="text-blue-800 font-semibold">{calculation.royalty_amount.toFixed(4)} SOL</p>
            </div>
            <div className="col-span-2">
              <p className="text-blue-600 font-medium">Creator Receives:</p>
              <p className="text-blue-800 font-semibold">{calculation.creator_amount.toFixed(4)} SOL</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoyaltyInfo; 