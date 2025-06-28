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
    
    const queryBody: any = {
      vector: vector,
      topK: topK,
      includeMetadata: true,
      includeValues: false
    };

    if (namespace) {
      queryBody.namespace = namespace;
    }

    const response = await fetch(`https://${config.indexName}-${config.environment}.svc.pinecone.io/query`, {
      method: 'POST',
      headers: {
        'Api-Key': config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryBody)
    });

    if (!response.ok) {
      throw new Error(`Pinecone query failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Pinecone query returned ${data.matches?.length || 0} results`);
    
    return { matches: data.matches || [] };
    
  } catch (error) {
    console.error('❌ Error querying Pinecone:', error);
    return { matches: [] };
  }
};

export const upsertToPinecone = async (vectors: Array<{ id: string; values: number[]; metadata?: any }>, namespace?: string) => {
  const config = initializePinecone();
  
  try {
    console.log('📤 Upserting vectors to Pinecone:', vectors.length);
    
    const upsertBody: any = {
      vectors: vectors
    };

    if (namespace) {
      upsertBody.namespace = namespace;
    }

    const response = await fetch(`https://${config.indexName}-${config.environment}.svc.pinecone.io/vectors/upsert`, {
      method: 'POST',
      headers: {
        'Api-Key': config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(upsertBody)
    });

    if (!response.ok) {
      throw new Error(`Pinecone upsert failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Vectors upserted successfully to Pinecone');
    
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ Error upserting to Pinecone:', error);
    return { success: false, error };
  }
}; 