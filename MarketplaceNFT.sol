// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/access/Ownable.sol";

contract MarketplaceNFT is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;
    uint256 public feeBasisPoints = 250; // 2.5% комиссия
    address public feeRecipient;

    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    mapping(uint256 => Listing) public listings;

    event Minted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event Listed(address indexed seller, uint256 indexed tokenId, uint256 price);
    event Delisted(address indexed seller, uint256 indexed tokenId);
    event Sold(address indexed buyer, address indexed seller, uint256 indexed tokenId, uint256 price);

    constructor(address _feeRecipient) ERC721("MarketplaceNFT", "MKTNFT") {
        feeRecipient = _feeRecipient;
    }

    function mint(string memory tokenURI) external returns (uint256) {
        uint256 tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        emit Minted(msg.sender, tokenId, tokenURI);
        return tokenId;
    }

    function list(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(price > 0, "Price must be positive");
        listings[tokenId] = Listing(msg.sender, price, true);
        approve(address(this), tokenId);
        emit Listed(msg.sender, tokenId, price);
    }

    function delist(uint256 tokenId) external {
        require(listings[tokenId].seller == msg.sender, "Not seller");
        listings[tokenId].active = false;
        emit Delisted(msg.sender, tokenId);
    }

    function buy(uint256 tokenId) external payable {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(msg.value >= listing.price, "Not enough ETH");
        require(listing.seller != msg.sender, "Cannot buy your own NFT");

        // Calculate fee
        uint256 fee = (listing.price * feeBasisPoints) / 10000;
        uint256 sellerAmount = listing.price - fee;

        // Transfer NFT
        _transfer(listing.seller, msg.sender, tokenId);

        // Pay seller and fee recipient
        payable(listing.seller).transfer(sellerAmount);
        if (fee > 0) {
            payable(feeRecipient).transfer(fee);
        }

        // Mark as sold
        listings[tokenId].active = false;

        emit Sold(msg.sender, listing.seller, tokenId, listing.price);
    }

    function setFee(uint256 _feeBasisPoints) external onlyOwner {
        require(_feeBasisPoints <= 1000, "Fee too high"); // max 10%
        feeBasisPoints = _feeBasisPoints;
    }

    function setFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Zero address");
        feeRecipient = _recipient;
    }
} 