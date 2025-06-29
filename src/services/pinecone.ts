// Pinecone Service
const PINECONE_API_KEY = process.env.EXPO_PUBLIC_PINECONE_API_KEY || 'pcsk_5hXzJx_2ouLG4AjX4ePsjFckY4RqbPWiJsqx5iEkUoSX4u7D4mQTeDTVo9zbUjCuPbEitS';
const PINECONE_ENVIRONMENT = process.env.EXPO_PUBLIC_PINECONE_ENVIRONMENT || 'us-east1-gcs';
const PINECONE_INDEX_NAME = process.env.EXPO_PUBLIC_PINECONE_INDEX || 'rag-project-index';

export const initializePinecone = () => {
  // Debug environment variable loading
  console.log('🔍 Pinecone Environment Variables:', {
    fromEnv: {
      apiKey: process.env.EXPO_PUBLIC_PINECONE_API_KEY ? 'Found' : 'Missing',
      environment: process.env.EXPO_PUBLIC_PINECONE_ENVIRONMENT || 'Missing',
      index: process.env.EXPO_PUBLIC_PINECONE_INDEX || 'Missing'
    },
    fallback: {
      apiKey: PINECONE_API_KEY ? 'Available' : 'Missing',
      environment: PINECONE_ENVIRONMENT,
      index: PINECONE_INDEX_NAME
    }
  });

  // Since we have fallback values, this should always work
  if (!PINECONE_API_KEY) {
    console.error('❌ Pinecone API key still missing after fallback!');
    throw new Error('Pinecone API key not available');
  }
  
  if (!PINECONE_ENVIRONMENT) {
    console.error('❌ Pinecone environment still missing after fallback!');
    throw new Error('Pinecone environment not available');
  }
  
  console.log('✅ Pinecone initialized:', {
    environment: PINECONE_ENVIRONMENT,
    hasApiKey: !!PINECONE_API_KEY,
    indexName: PINECONE_INDEX_NAME
  });
  
  return {
    apiKey: PINECONE_API_KEY,
    environment: PINECONE_ENVIRONMENT,
    indexName: PINECONE_INDEX_NAME
  };
};

// Example Pinecone functions
export const queryPinecone = async (vector: number[], topK: number = 10, namespace?: string) => {
  const config = initializePinecone();
  
  try {
    console.log('🔍 Querying Pinecone with vector of length:', vector.length);
    console.log('🔧 Using config:', {
      indexName: config.indexName,
      environment: config.environment,
      hasApiKey: !!config.apiKey
    });
    
    const queryBody: {
      vector: number[];
      topK: number;
      includeMetadata: boolean;
      includeValues: boolean;
      namespace?: string;
    } = {
      vector: vector,
      topK: topK,
      includeMetadata: true,
      includeValues: false
    };

    if (namespace) {
      queryBody.namespace = namespace;
    }

    // Try the original URL format first
    let url = `https://${config.indexName}-${config.environment}.svc.pinecone.io/query`;
    console.log('🌐 Attempting query to URL:', url);
    
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Api-Key': config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryBody)
    });

    // If the first URL fails, try alternative URL format
    if (!response.ok) {
      console.log(`⚠️ First URL failed with ${response.status}, trying alternative format...`);
      
      // Try alternative URL format
      url = `https://${config.indexName}.svc.${config.environment}.pinecone.io/query`;
      console.log('🌐 Trying alternative URL:', url);
      
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Api-Key': config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(queryBody)
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Pinecone Query API Error Response:', errorText);
      throw new Error(`Pinecone query failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Pinecone query returned ${data.matches?.length || 0} results`);
    
    return { matches: data.matches || [] };
    
  } catch (error) {
    console.error('❌ Error querying Pinecone:', error);
    
    // Provide more detailed error information
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      console.error('🌐 Network connectivity issue detected for query');
      console.error('🔧 Possible solutions:');
      console.error('   1. Check internet connection');
      console.error('   2. Verify Pinecone API key is valid');
      console.error('   3. Check if Pinecone index exists and is active');
      console.error('   4. Try again in a few minutes (rate limiting)');
    }
    
    return { matches: [] };
  }
};

export const upsertToPinecone = async (vectors: Array<{ id: string; values: number[]; metadata?: any }>, namespace?: string) => {
  const config = initializePinecone();
  
  try {
    console.log('📤 Upserting vectors to Pinecone:', vectors.length);
    console.log('🔧 Using config:', {
      indexName: config.indexName,
      environment: config.environment,
      hasApiKey: !!config.apiKey
    });
    
    const upsertBody: any = {
      vectors: vectors
    };

    if (namespace) {
      upsertBody.namespace = namespace;
    }

    // Try the new Pinecone URL format first
    let url = `https://${config.indexName}-${config.environment}.svc.pinecone.io/vectors/upsert`;
    
    console.log('🌐 Attempting upsert to URL:', url);
    console.log('📦 Request body:', JSON.stringify(upsertBody, null, 2));

    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Api-Key': config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(upsertBody)
    });

    // If the first URL fails, try alternative URL formats
    if (!response.ok) {
      console.log(`⚠️ First URL failed with ${response.status}, trying alternative format...`);
      
      // Try alternative URL format (newer Pinecone API)
      url = `https://${config.indexName}.svc.${config.environment}.pinecone.io/vectors/upsert`;
      console.log('🌐 Trying alternative URL:', url);
      
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Api-Key': config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(upsertBody)
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Pinecone API Error Response:', errorText);
      throw new Error(`Pinecone upsert failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Vectors upserted successfully to Pinecone');
    
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ Error upserting to Pinecone:', error);
    
    // Provide more detailed error information
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      console.error('🌐 Network connectivity issue detected');
      console.error('🔧 Possible solutions:');
      console.error('   1. Check internet connection');
      console.error('   2. Verify Pinecone API key is valid');
      console.error('   3. Check if Pinecone index exists');
      console.error('   4. Try again in a few minutes (rate limiting)');
    }
    
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Test function to diagnose Pinecone connectivity issues
export const testPineconeConnection = async () => {
  const config = initializePinecone();
  
  console.log('🧪 Testing Pinecone connection...');
  
  const testResults: {
    config: {
      indexName: string;
      environment: string;
      hasApiKey: boolean;
      apiKeyLength: number;
    };
    urls: Array<{
      url: string;
      status?: number;
      statusText?: string;
      ok?: boolean;
      data?: any;
      error?: string;
    }>;
    connectivity: 'unknown' | 'success' | 'failed';
    error: string | null;
  } = {
    config: {
      indexName: config.indexName,
      environment: config.environment,
      hasApiKey: !!config.apiKey,
      apiKeyLength: config.apiKey.length
    },
    urls: [],
    connectivity: 'unknown',
    error: null
  };
  
  // Test different URL formats
  const urlFormats = [
    `https://${config.indexName}-${config.environment}.svc.pinecone.io`,
    `https://${config.indexName}.svc.${config.environment}.pinecone.io`,
    `https://${config.indexName}-${config.environment}.svc.gcp-starter.pinecone.io`,
    `https://${config.indexName}.svc.gcp-starter.pinecone.io`
  ];
  
  for (const baseUrl of urlFormats) {
    try {
      console.log(`🌐 Testing URL format: ${baseUrl}`);
      
      const response = await fetch(`${baseUrl}/describe_index_stats`, {
        method: 'POST',
        headers: {
          'Api-Key': config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
             const urlTest: {
         url: string;
         status?: number;
         statusText?: string;
         ok?: boolean;
         data?: any;
         error?: string;
       } = {
         url: baseUrl,
         status: response.status,
         statusText: response.statusText,
         ok: response.ok
       };
       
       if (response.ok) {
         const data = await response.json();
         urlTest.data = data;
         console.log(`✅ Successfully connected to: ${baseUrl}`);
         testResults.connectivity = 'success';
       } else {
         const errorText = await response.text();
         urlTest.error = errorText;
         console.log(`❌ Failed to connect to: ${baseUrl} - ${response.status}`);
       }
      
      testResults.urls.push(urlTest);
      
    } catch (error) {
      console.log(`💥 Network error for: ${baseUrl}`);
      testResults.urls.push({
        url: baseUrl,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  if (testResults.connectivity !== 'success') {
    testResults.connectivity = 'failed';
    testResults.error = 'All URL formats failed';
  }
  
  console.log('🧪 Pinecone connection test results:', testResults);
  return testResults;
}; 