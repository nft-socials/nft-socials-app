import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getAllPosts, createPost } from '@/services/contract';
import { useAccount } from '@starknet-react/core';
import { storeOnIPFS } from '@/services/ipfs';

const ContractTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { account } = useAccount();

  const testContract = async () => {
    setIsLoading(true);
    setTestResult('Testing contract connection...');

    try {
      const posts = await getAllPosts(0, 5);
      setTestResult(`✅ Contract working! Found ${posts.length} posts`);
    } catch (error) {
      console.error('Contract test failed:', error);
      setTestResult(`❌ Contract test failed: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testIPFS = async () => {
    setIsLoading(true);
    setTestResult('Testing IPFS upload...');

    try {
      const metadata = {
        content: 'Test post content',
        timestamp: Date.now(),
        author: 'test-user',
        version: '1.0' as const
      };
      const hash = await storeOnIPFS(metadata);
      setTestResult(`✅ IPFS working! Hash: ${hash}`);
    } catch (error) {
      console.error('IPFS test failed:', error);
      setTestResult(`❌ IPFS test failed: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testCreatePost = async () => {
    if (!account) {
      setTestResult('❌ Please connect wallet first');
      return;
    }

    setIsLoading(true);
    setTestResult('Testing post creation...');

    try {
      const result = await createPost(account, 'test-hash', 0);
      setTestResult(`✅ CreatePost working! TX: ${result}`);
    } catch (error) {
      console.error('CreatePost test failed:', error);
      setTestResult(`❌ CreatePost test failed: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 m-4">
      <h3 className="text-lg font-semibold mb-4">Contract Integration Test</h3>
      <div className="flex gap-2 mb-4">
        <Button
          onClick={testContract}
          disabled={isLoading}
          size="sm"
        >
          {isLoading ? 'Testing...' : 'Test Contract'}
        </Button>
        <Button
          onClick={testIPFS}
          disabled={isLoading}
          size="sm"
        >
          Test IPFS
        </Button>
        <Button
          onClick={testCreatePost}
          disabled={isLoading}
          size="sm"
        >
          Test CreatePost
        </Button>
      </div>
      {testResult && (
        <div className="p-3 bg-muted rounded-md">
          <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
        </div>
      )}
    </Card>
  );
};

export default ContractTest;
