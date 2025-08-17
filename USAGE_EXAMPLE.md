# Pipeline Creation with Nested Stages - Usage Example

## 🚀 Production-Grade Solution

This implementation provides a complete, production-ready solution for creating pipelines with multiple stages in a single database transaction using Prisma's nested writes.

## ✅ What We've Implemented

### 1. **Backend (Prisma + Next.js API)**
- ✅ Atomic transactions using `prisma.$transaction()`
- ✅ Nested stage creation with `pipeline.update({ data: { stages: { create: [...] } } })`
- ✅ Automatic cascade deletion (pipeline deleted → stages deleted)
- ✅ Position auto-calculation for stages
- ✅ Comprehensive error handling & logging
- ✅ Production-grade validation with Zod schemas

### 2. **Frontend (React Hook + Component)**
- ✅ Type-safe interfaces with TypeScript
- ✅ `createPipelineWithStages()` method in usePipelineData hook
- ✅ Pre-built templates (Sales, Support, Simple workflows)
- ✅ Real-time state management
- ✅ Material-UI components with proper theming

## 📋 How to Use

### Basic Usage (Frontend)

```tsx
import { usePipelineData } from '@/hooks/usePipelineData';

function CreatePipelineComponent() {
  const { createPipelineWithStages } = usePipelineData('org-123');

  const handleCreatePipeline = async () => {
    try {
      const result = await createPipelineWithStages({
        name: 'Sales Pipeline 2024',
        description: 'Main sales process for Q4',
        status: 'Active',
        stages: [
          { name: 'Lead', color: '#3B82F6', description: 'New prospects' },
          { name: 'Qualified', color: '#8B5CF6', description: 'Validated leads' },
          { name: 'Proposal', color: '#F59E0B', description: 'Sent proposals' },
          { name: 'Negotiation', color: '#EF4444', description: 'Active deals' },
          { name: 'Closed Won', color: '#10B981', description: 'Successful deals' },
        ]
      });
      
      console.log('Pipeline created:', result);
    } catch (error) {
      console.error('Failed to create pipeline:', error);
    }
  };

  return (
    <button onClick={handleCreatePipeline}>
      Create Sales Pipeline
    </button>
  );
}
```

### Advanced Usage with Dialog Component

```tsx
import CreatePipelineWithStagesDialog from '@/components/pipeline/CreatePipelineWithStagesDialog';

function PipelineManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  return (
    <div>
      <button onClick={() => setDialogOpen(true)}>
        Create New Pipeline
      </button>
      
      <CreatePipelineWithStagesDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        organizationId="org-123"
        onSuccess={(pipeline) => {
          console.log('New pipeline created:', pipeline);
          // Refresh your pipeline list, show success message, etc.
        }}
      />
    </div>
  );
}
```

## 🔥 Key Benefits

### 1. **Single Database Transaction**
```typescript
// OLD WAY: Multiple API calls (inefficient)
const pipeline = await createPipeline({name: 'Sales'});
await createStage(pipeline.id, {name: 'Lead'});
await createStage(pipeline.id, {name: 'Qualified'});
// ... more stages

// NEW WAY: Single transaction (efficient & atomic)
const result = await createPipelineWithStages({
  name: 'Sales',
  stages: [
    {name: 'Lead'}, 
    {name: 'Qualified'}, 
    // ... all stages
  ]
});
```

### 2. **Automatic Cascade Deletion**
```sql
-- Schema ensures clean cascade deletion
model Pipeline {
  stages PipelineStageModel[]
}

model PipelineStageModel {
  pipeline Pipeline @relation(..., onDelete: Cascade)
  cards    PipelineCard[]
}
```

### 3. **Production Error Handling**
```typescript
// Comprehensive error handling for all scenarios
if (error?.code === 'P2002') {
  return 'Pipeline name already exists';
}
if (error?.code === 'P2025') {
  return 'Organization not found';
}
// ... more error cases
```

## 🎯 API Request/Response

### Request Format
```json
POST /api/pipeline
{
  "name": "Sales Pipeline Q4",
  "description": "Main sales process",
  "status": "Active",
  "stages": [
    {
      "name": "Lead",
      "color": "#3B82F6",
      "description": "New prospects",
      "position": 1000
    },
    {
      "name": "Qualified",
      "color": "#8B5CF6", 
      "description": "Validated leads",
      "position": 2000
    }
  ]
}
```

### Response Format
```json
{
  "id": "pipeline_abc123",
  "name": "Sales Pipeline Q4",
  "description": "Main sales process",
  "status": "Active",
  "organizationId": "org_456",
  "stages": [
    {
      "id": "stage_def456",
      "name": "Lead",
      "color": "#3B82F6",
      "description": "New prospects",
      "position": 1000,
      "cards": []
    },
    {
      "id": "stage_ghi789",
      "name": "Qualified", 
      "color": "#8B5CF6",
      "description": "Validated leads",
      "position": 2000,
      "cards": []
    }
  ],
  "createdAt": "2024-01-16T20:40:00Z"
}
```

## 🎨 Pre-built Templates

The dialog component includes ready-to-use templates:

### Sales Template (6 stages)
- Lead → Qualified → Proposal → Negotiation → Closed Won → Closed Lost

### Simple Template (4 stages)  
- To Do → In Progress → Review → Done

### Support Template (4 stages)
- New → In Progress → Waiting → Resolved

## 🔧 Database Performance

The solution includes optimizations:

1. **Indexes on key fields**:
   - `@@unique([pipelineId, position])` on stages
   - Foreign key indexes automatically created

2. **Efficient queries**:
   - Single transaction reduces database roundtrips
   - Proper `include` statements for related data
   - Ordered results with `orderBy: { position: 'asc' }`

## 🛡️ Production Features

### Validation
- ✅ Zod schema validation for all inputs
- ✅ Color format validation (hex colors)
- ✅ Stage position auto-calculation
- ✅ Minimum/maximum stage limits

### Error Handling  
- ✅ Database connection errors
- ✅ Constraint violations
- ✅ Resource not found errors
- ✅ Transaction rollback on failures

### Security
- ✅ Organization-scoped access
- ✅ Authentication required via `requireAuthWithOrg`
- ✅ Input sanitization and validation

### Logging
- ✅ Detailed error logging with stack traces
- ✅ Success logging with metadata
- ✅ Request/response logging for debugging

## 🚀 Getting Started

1. **Use the updated API route** (`src/app/api/pipeline/route.ts`)
2. **Use the updated hook** (`src/hooks/usePipelineData.ts`) 
3. **Import the dialog component** (`src/components/pipeline/CreatePipelineWithStagesDialog.tsx`)
4. **Call `createPipelineWithStages()`** instead of multiple API calls

That's it! You now have a production-grade, efficient pipeline creation system. 🎉
