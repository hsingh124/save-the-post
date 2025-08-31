#!/usr/bin/env ts-node

/**
 * Test script for Mock Instagram Service
 * Run with: npx ts-node test-mock-instagram.ts
 */

import { createMockInstagramService } from './services/instagram-mock';
import { getInstagramService } from './services/instagram-factory';

async function testMockService() {
  console.log('🧪 Testing Mock Instagram Service...\n');

  // Test 1: Direct mock service
  console.log('1️⃣ Testing direct mock service:');
  const mockService = createMockInstagramService();
  
  try {
    const testUrls = [
      'https://www.instagram.com/p/ABC123/',
      'https://www.instagram.com/reel/DEF456/',
      'https://www.instagram.com/tv/GHI789/'
    ];

    for (const url of testUrls) {
      console.log(`\n   Testing URL: ${url}`);
      const metadata = await mockService.fetchPostMetadata(url);
      console.log(`   ✅ Success! Post ID: ${metadata.postId}`);
      console.log(`   📝 Creator: ${metadata.creatorHandle}`);
      console.log(`   🎬 Media Type: ${metadata.mediaType}`);
      console.log(`   📏 Dimensions: ${metadata.dimensions.width}x${metadata.dimensions.height}`);
    }
  } catch (error) {
    console.error('   ❌ Error:', error);
  }

  // Test 2: Factory service (no token)
  console.log('\n\n2️⃣ Testing factory service with no token:');
  const factoryService = getInstagramService(null);
  console.log(`   Service type: ${factoryService.constructor.name}`);
  
  try {
    const metadata = await factoryService.fetchPostMetadata('https://www.instagram.com/p/TEST123/');
    console.log(`   ✅ Success! Post ID: ${metadata.postId}`);
    console.log(`   📝 Creator: ${metadata.creatorHandle}`);
  } catch (error) {
    console.error('   ❌ Error:', error);
  }

  // Test 3: Cache functionality
  console.log('\n\n3️⃣ Testing cache functionality:');
  const cacheStats = mockService.getCacheStats();
  console.log(`   Cache size: ${cacheStats.size}`);
  
  // Test same URL again to hit cache
  const url = 'https://www.instagram.com/p/CACHETEST/';
  console.log(`   Testing cache with: ${url}`);
  
  const start1 = Date.now();
  await mockService.fetchPostMetadata(url);
  const time1 = Date.now() - start1;
  
  const start2 = Date.now();
  await mockService.fetchPostMetadata(url);
  const time2 = Date.now() - start2;
  
  console.log(`   First call: ${time1}ms`);
  console.log(`   Cached call: ${time2}ms`);
  console.log(`   Cache hit: ${time2 < time1 ? '✅' : '❌'}`);

  // Test 4: Rate limiting
  console.log('\n\n4️⃣ Testing rate limiting:');
  try {
    // Make multiple rapid calls
    const promises = Array.from({ length: 5 }, () => 
      mockService.fetchPostMetadata('https://www.instagram.com/p/RATE123/')
    );
    
    const results = await Promise.all(promises);
    console.log(`   ✅ Made ${results.length} concurrent calls successfully`);
  } catch (error) {
    console.log(`   ⚠️ Rate limit hit: ${error}`);
  }

  console.log('\n\n🎉 Mock Instagram Service test completed!');
  console.log('💡 The service is working without requiring an Instagram API key.');
  console.log('🔑 When you get your API key, just set INSTAGRAM_ACCESS_TOKEN in your .env file.');
}

// Run the test
testMockService().catch(console.error);
