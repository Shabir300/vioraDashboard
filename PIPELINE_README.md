# Pipeline Feature - CRM Deal Management

A complete, production-ready Pipeline feature for CRM deal management with strict theming requirements and real-time capabilities.

## 🎯 Features

- **Kanban Board**: Visual pipeline management with drag-and-drop
- **Stage Management**: Create, edit, delete, and reorder pipeline stages
- **Deal Management**: Add, edit, delete, and move deals between stages
- **Theme-Aware UI**: All styling comes from centralized theme system
- **Real-time Updates**: WebSocket-based live collaboration
- **Responsive Design**: Mobile-first approach with MUI components
- **Type Safety**: Full TypeScript implementation with Zod validation

## 🏗️ Architecture

### System Overview
```
Frontend (Next.js + MUI) → Backend (Next.js API) → Database (PostgreSQL + Prisma)
         ↓                           ↓                        ↓
   Theme System              Real-time Server           Data Persistence
   Component Variants        WebSocket Events          Optimistic Updates
   Drag & Drop              Event Broadcasting        Transaction Safety
```

### Key Components
- **Pipeline Page**: Main Kanban board interface
- **PipelineStage**: Individual stage columns
- **PipelineCard**: Deal cards with client information
- **CreateCardDialog**: Add new deals to pipeline
- **CreateStageDialog**: Add new stages to pipeline
- **Theme System**: Centralized styling with semantic tokens

## 🎨 Theming System

### Design Philosophy
- **Single Source of Truth**: All styling comes from `@/theme`
- **Semantic Tokens**: Meaningful color names (success, warning, danger)
- **Component Variants**: Pre-defined styles for common use cases
- **Dark Mode Ready**: Automatic theme switching
- **No Hardcoded Values**: ESLint rules prevent style violations

### Theme Structure
```typescript
// Semantic Colors
palette.semantic.success    // #12b76a
palette.semantic.warning    // #fb6514
palette.semantic.danger     // #f04438

// Pipeline Stage Colors
palette.stage.lead          // #3B82F6
palette.stage.contacted     // #8B5CF6
palette.stage.negotiation   // #F59E0B
palette.stage.closed        // #10B981

// Component Variants
<Button variant="pipelineAction" />
<Chip variant="stageBadge" />
<Chip variant="priorityBadge" />
```

### ESLint Rules
Prevents hardcoded colors and styles:
```json
{
  "no-restricted-syntax": [
    "error",
    {
      "selector": "Literal[value=/^#[0-9A-Fa-f]{6}$/]",
      "message": "Hardcoded hex colors are not allowed. Use theme.palette tokens instead."
    }
  ]
}
```

## 🗄️ Database Schema

### Core Models
```prisma
model Pipeline {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  description    String?
  isDefault      Boolean  @default(false)
  stages         PipelineStageModel[]
  pipelineCards PipelineCard[]
}

model PipelineStageModel {
  id          String   @id @default(cuid())
  pipelineId  String
  name        String
  description String?
  color       String   @default("#6B7280")
  position    Int
  cards       PipelineCard[]
}

model PipelineCard {
  id             String   @id @default(cuid())
  organizationId String
  title          String
  description    String?
  value          Float?
  priority       String   @default("medium")
  dueDate        DateTime?
  position       Int
  stage          PipelineStageModel
  client         Client
}
```

## 🚀 API Endpoints

### Pipeline Management
```typescript
GET    /api/pipeline?organizationId={id}     // Get all pipelines
POST   /api/pipeline                         // Create pipeline
PUT    /api/pipeline                         // Update pipeline
DELETE /api/pipeline?id={id}                 // Delete pipeline
```

### Stage Management
```typescript
GET    /api/pipeline/stages?pipelineId={id}  // Get stages
POST   /api/pipeline/stages                  // Create stage
PUT    /api/pipeline/stages                  // Update stage
DELETE /api/pipeline/stages?id={id}          // Delete stage
```

### Card Management
```typescript
GET    /api/pipeline/cards?stageId={id}      // Get cards
POST   /api/pipeline/cards                   // Create card
PUT    /api/pipeline/cards                   // Update card
DELETE /api/pipeline/cards?id={id}           // Delete card
PATCH  /api/pipeline/cards/move              // Move card between stages
```

## 🧪 Testing Strategy

### Unit Tests (Jest)
- Theme system validation
- Component variant testing
- Utility function testing
- Type safety verification

### Integration Tests
- API endpoint testing
- Database operations
- Validation schemas
- Error handling

### E2E Tests (Playwright)
- Complete user workflows
- Theme application verification
- Responsive design testing
- Cross-browser compatibility

### Test Examples
```typescript
// Theme Testing
describe('Pipeline Theme System', () => {
  it('should create theme with semantic colors', () => {
    const theme = createMuiThemeFromCssVars('light');
    expect(theme.palette.semantic.success).toBe('#12b76a');
    expect(theme.palette.stage.lead).toBe('#3B82F6');
  });
});

// E2E Testing
test('should apply theme variants correctly', async ({ page }) => {
  const card = page.locator('[data-testid="pipeline-card"]').first();
  const cardClasses = await card.getAttribute('class');
  expect(cardClasses).toContain('MuiCard');
  expect(cardClasses).toContain('MuiPaper');
});
```

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Prisma CLI

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Configure DATABASE_URL and other variables

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Environment Variables
```env
DATABASE_URL="postgresql://user:password@localhost:5432/pipeline_db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## 📱 Usage Examples

### Creating a New Deal
```typescript
import { usePipelineData } from '@/hooks/usePipelineData';

const { createCard } = usePipelineData(organizationId);

const newDeal = await createCard({
  title: 'Enterprise Client',
  description: 'Large company seeking CRM solution',
  value: 100000,
  priority: 'high',
  stageId: 'lead-stage-id',
  clientId: 'client-id',
});
```

### Moving a Deal
```typescript
const { moveCard } = usePipelineData(organizationId);

await moveCard('deal-id', 'new-stage-id', 0);
```

### Adding a New Stage
```typescript
const { createStage } = usePipelineData(organizationId);

const newStage = await createStage('pipeline-id', {
  name: 'Qualified',
  description: 'Leads that meet criteria',
  color: '#10B981',
});
```

## 🎯 Best Practices

### Theme Usage
✅ **Correct**
```typescript
sx={{ 
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  borderRadius: theme.shape.borderRadius,
}}
```

❌ **Incorrect**
```typescript
sx={{ 
  backgroundColor: '#ffffff',        // Hardcoded color
  color: 'black',                   // Hardcoded color
  borderRadius: '8px',              // Hardcoded size
}}
```

### Component Structure
- Use theme variants when available
- Prefer `theme.palette` over direct color values
- Use `theme.spacing` for consistent margins/padding
- Leverage `theme.typography` for text styling

### Performance Optimization
- Implement virtualization for large pipelines
- Use React.memo for expensive components
- Optimistic updates for better UX
- Debounced API calls for real-time features

## 🔮 Future Enhancements

### Planned Features
- **Advanced Filtering**: Filter deals by value, priority, date
- **Bulk Operations**: Move multiple deals simultaneously
- **Pipeline Templates**: Pre-configured pipeline structures
- **Analytics Dashboard**: Deal conversion metrics
- **Email Integration**: Automatic follow-up reminders
- **Mobile App**: Native mobile experience

### Scalability Considerations
- **Virtualization**: Handle thousands of deals efficiently
- **Pagination**: Load deals in chunks for large pipelines
- **Caching**: Redis-based caching for frequently accessed data
- **CDN**: Static asset optimization
- **Microservices**: Break down into smaller, focused services

## 🐛 Troubleshooting

### Common Issues

**Theme not applying correctly**
- Check that `ThemeProvider` wraps the component tree
- Verify theme tokens are properly defined
- Ensure no hardcoded styles override theme values

**Drag and drop not working**
- Verify `@dnd-kit` dependencies are installed
- Check that drag handlers are properly configured
- Ensure drop zones have correct IDs

**Database connection errors**
- Verify `DATABASE_URL` is correct
- Check PostgreSQL service is running
- Run `npx prisma generate` to update client

**TypeScript errors**
- Run `npm run type-check` to identify issues
- Ensure all theme augmentations are properly defined
- Check that component variants are correctly typed

## 📚 Additional Resources

- [Material-UI Theme Customization](https://mui.com/material-ui/customization/theming/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [@dnd-kit Documentation](https://docs.dndkit.com/)
- [Playwright Testing](https://playwright.dev/)

## 🤝 Contributing

1. Follow the theming guidelines strictly
2. Write tests for new functionality
3. Ensure TypeScript types are complete
4. Update documentation for API changes
5. Follow the established component patterns

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
