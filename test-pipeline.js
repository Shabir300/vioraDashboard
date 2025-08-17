#!/usr/bin/env node

/**
 * Test script to verify complete pipeline functionality
 * This script tests the entire pipeline system end-to-end
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ORG_ID = 'org_seed_1';

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`Making request to: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error(`Error: ${response.status}`, data);
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return { data, status: response.status };
}

async function testPipelineSystem() {
  console.log('🚀 Testing Pipeline System End-to-End...\n');

  try {
    // Test 1: Get existing pipelines
    console.log('1. Testing GET /api/pipeline...');
    const { data: pipelines } = await makeRequest(`/api/pipeline?organizationId=${ORG_ID}`);
    console.log(`✅ Found ${pipelines.length} existing pipelines`);
    console.log(`   Pipeline names: ${pipelines.map(p => p.name).join(', ')}\n`);

    // Test 2: Create a new pipeline
    console.log('2. Testing POST /api/pipeline...');
    const newPipelineData = {
      name: 'Test Pipeline - ' + Date.now(),
      description: 'Automated test pipeline',
      status: 'Active',
      organizationId: ORG_ID,
    };

    const { data: newPipeline } = await makeRequest('/api/pipeline', {
      method: 'POST',
      body: JSON.stringify(newPipelineData),
    });
    console.log(`✅ Created new pipeline: ${newPipeline.name} (ID: ${newPipeline.id})\n`);

    // Test 3: Create stages for the pipeline
    console.log('3. Testing POST /api/pipeline/stages...');
    const stageNames = ['Lead', 'Contacted', 'Negotiation', 'Closed'];
    const stageColors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'];
    const createdStages = [];

    for (let i = 0; i < stageNames.length; i++) {
      const stageData = {
        name: stageNames[i],
        description: `${stageNames[i]} stage`,
        color: stageColors[i],
        position: i,
        pipelineId: newPipeline.id,
      };

      const { data: newStage } = await makeRequest('/api/pipeline/stages', {
        method: 'POST',
        body: JSON.stringify(stageData),
      });
      
      createdStages.push(newStage);
      console.log(`   ✅ Created stage: ${newStage.name} (${newStage.color})`);
    }
    console.log('');

    // Test 4: Create cards in the pipeline
    console.log('4. Testing POST /api/pipeline/cards...');
    const cardData = {
      title: 'Test Deal - ' + Date.now(),
      description: 'Automated test deal',
      value: 50000,
      priority: 'high',
      pipelineId: newPipeline.id,
      stageId: createdStages[0].id, // Put in first stage
      position: 0,
      clientName: 'Test Client Corp',
      clientEmail: 'test@testclient.com',
      clientCompany: 'Test Client Corp',
    };

    const { data: newCard } = await makeRequest('/api/pipeline/cards', {
      method: 'POST',
      body: JSON.stringify(cardData),
    });
    console.log(`✅ Created card: ${newCard.title} in stage: ${createdStages[0].name}\n`);

    // Test 5: Move card to different stage
    console.log('5. Testing PATCH /api/pipeline/cards/move...');
    const moveData = {
      cardId: newCard.id,
      newStageId: createdStages[1].id, // Move to second stage
      newPosition: 0,
    };

    await makeRequest('/api/pipeline/cards/move', {
      method: 'PATCH',
      body: JSON.stringify(moveData),
    });
    console.log(`✅ Moved card to stage: ${createdStages[1].name}\n`);

    // Test 6: Update stage
    console.log('6. Testing PUT /api/pipeline/stages...');
    const updateStageData = {
      id: createdStages[0].id,
      name: 'Updated Lead Stage',
      description: 'Updated lead stage description',
    };

    const { data: updatedStage } = await makeRequest('/api/pipeline/stages', {
      method: 'PUT',
      body: JSON.stringify(updateStageData),
    });
    console.log(`✅ Updated stage: ${updatedStage.name}\n`);

    // Test 7: Get pipeline with all data
    console.log('7. Testing full pipeline data retrieval...');
    const { data: fullPipelines } = await makeRequest(`/api/pipeline?organizationId=${ORG_ID}`);
    const testPipeline = fullPipelines.find(p => p.id === newPipeline.id);
    
    if (testPipeline) {
      console.log(`✅ Pipeline contains ${testPipeline.stages.length} stages`);
      console.log(`✅ Pipeline contains ${testPipeline.stages.reduce((acc, s) => acc + s.cards.length, 0)} cards`);
      console.log(`✅ Pipeline structure:`);
      testPipeline.stages.forEach(stage => {
        console.log(`   - ${stage.name}: ${stage.cards.length} cards`);
      });
    } else {
      throw new Error('Test pipeline not found in results');
    }

    console.log('\n🎉 All tests passed! Pipeline system is working correctly.\n');

    // Cleanup
    console.log('8. Cleaning up test data...');
    await makeRequest(`/api/pipeline?id=${newPipeline.id}`, {
      method: 'DELETE',
    });
    console.log('✅ Cleaned up test pipeline\n');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testPipelineSystem()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testPipelineSystem };
