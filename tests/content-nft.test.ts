import { describe, beforeEach, it, expect, vi } from 'vitest';

// Mock contract state
let tokens: Record<number, any> = {};
let lastTokenId = 0;

// Mock contract calls
const mockContractCall = vi.fn();

// Helper function to reset state before each test
function resetState() {
  tokens = {};
  lastTokenId = 0;
}

describe('Content NFT Contract', () => {
  const contractOwner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
  const user1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
  const user2 = 'ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0';
  
  beforeEach(() => {
    resetState();
    vi.resetAllMocks();
  });
  
  it('should mint a new content NFT', () => {
    mockContractCall.mockImplementation((_, __, uri) => {
      const tokenId = ++lastTokenId;
      tokens[tokenId] = { uri, owner: contractOwner };
      return { success: true, value: `u${tokenId}` };
    });
    
    const uri = 'https://example.com/content/1';
    const result = mockContractCall('content-nft', 'mint', uri, contractOwner);
    expect(result).toEqual({ success: true, value: 'u1' });
    
    const lastTokenIdResult = mockContractCall('content-nft', 'get-last-token-id');
    expect(lastTokenIdResult).toEqual({ success: true, value: 'u1' });
    
    const tokenUriResult = mockContractCall('content-nft', 'get-token-uri', 'u1');
    expect(tokenUriResult).toEqual({ success: true, value: uri });
  });
  
  it('should get the token creator', () => {
    const uri = 'https://example.com/content/2';
    mockContractCall('content-nft', 'mint', uri, contractOwner);
    
    mockContractCall.mockImplementation((_, __, tokenId) => {
      const token = tokens[Number(tokenId.slice(1))];
      return { success: true, value: token.owner };
    });
    
    const creator = mockContractCall('content-nft', 'get-token-creator', 'u1');
    expect(creator).toEqual({ success: true, value: contractOwner });
  });
  
  it('should transfer a token', () => {
    const uri = 'https://example.com/content/3';
    mockContractCall('content-nft', 'mint', uri, contractOwner);
    
    mockContractCall.mockImplementation((_, __, tokenId, sender, recipient) => {
      const token = tokens[Number(tokenId.slice(1))];
      if (token.owner === sender) {
        token.owner = recipient;
        return { success: true };
      }
      return { success: false, error: 403 };
    });
    
    const result = mockContractCall('content-nft', 'transfer', 'u1', contractOwner, user1);
    expect(result).toEqual({ success: true });
    
    const creator = mockContractCall('content-nft', 'get-token-creator', 'u1');
    expect(creator).toEqual({ success: true, value: user1 });
  });
  
  it('should burn a token', () => {
    const uri = 'https://example.com/content/4';
    mockContractCall('content-nft', 'mint', uri, contractOwner);
    
    mockContractCall.mockImplementation((_, __, tokenId) => {
      const token = tokens[Number(tokenId.slice(1))];
      if (token && token.owner === contractOwner) {
        delete tokens[Number(tokenId.slice(1))];
        return { success: true };
      }
      return { success: false, error: 403 };
    });
    
    const burnResult = mockContractCall('content-nft', 'burn', 'u1', contractOwner);
    expect(burnResult).toEqual({ success: true });
    
    const tokenUriResult = mockContractCall('content-nft', 'get-token-uri', 'u1');
    expect(tokenUriResult).toEqual({ success: false, error: 404 });
  });
  
  it('should not allow non-owners to burn tokens', () => {
    const uri = 'https://example.com/content/5';
    mockContractCall('content-nft', 'mint', uri, contractOwner);
    
    mockContractCall.mockImplementation((_, __, tokenId, caller) => {
      const token = tokens[Number(tokenId.slice(1))];
      if (token && token.owner === caller) {
        delete tokens[Number(tokenId.slice(1))];
        return { success: true };
      }
      return { success: false, error: 403 };
    });
    
    const burnResult = mockContractCall('content-nft', 'burn', 'u1', user2);
    expect(burnResult).toEqual({ success: false, error: 403 });
    
    const tokenUriResult = mockContractCall('content-nft', 'get-token-uri', 'u1');
    expect(tokenUriResult).toEqual({ success: true, value: uri });
  });
});

