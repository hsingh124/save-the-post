# Instagram Saves Knowledge Dashboard

A personal knowledge dashboard for Instagram saves with LLM enrichment and hybrid search capabilities.

## 🎯 Vision

Transform your Instagram saves into a searchable, organized knowledge base. Import your saved posts, get AI-powered topic extraction, and find what you're looking for instantly with hybrid search (BM25 + vector similarity).

## ✨ Features

- **Seamless Ingestion**: Import Instagram data exports or forward post links via bots
- **LLM Enrichment**: Automatic topic extraction, keyword generation, and entity recognition
- **Hybrid Search**: Combine traditional text search with AI-powered semantic search
- **Smart Organization**: Collections, tags, and personal notes
- **Fast Performance**: Cached thumbnails, optimized search, and responsive UI
- **Privacy First**: No scraping - only user-provided data and official Instagram APIs

## 🏗️ Architecture

- **Monorepo**: pnpm + Turborepo for efficient development
- **Web App**: Next.js 15 with App Router
- **API**: Fastify-based REST API with TypeScript
- **Workers**: Background job processing with BullMQ
- **Database**: PostgreSQL with pgvector for embeddings
- **Search**: Meilisearch for BM25 + pgvector for semantic search
- **Storage**: S3-compatible object storage for files and thumbnails

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- Docker and Docker Compose
- Instagram Developer Account (for oEmbed API)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd save-the-post
pnpm install
```

### 2. Start Infrastructure

```bash
docker-compose up -d
```

This starts:
- PostgreSQL with pgvector (port 5432)
- Redis (port 6379)
- Meilisearch (port 7700)
- MinIO S3 (port 9000, console 9001)

### 3. Environment Configuration

```bash
cp env.example .env
# Edit .env with your API keys and configuration
```

### 4. Database Setup

The database schema will be automatically created when PostgreSQL starts. You can also run it manually:

```bash
psql -h localhost -U postgres -d save_the_post -f packages/shared/src/schema.sql
```

### 5. Development

```bash
# Start all services
pnpm dev

# Or start individually:
pnpm dev:web      # Next.js web app
pnpm dev:api      # Fastify API
pnpm dev:workers  # Background workers
```

## 📁 Project Structure

```
save-the-post/
├── apps/
│   ├── web/                 # Next.js 15 web application
│   ├── api/                 # Fastify API server
│   └── workers/             # Background job processors
├── packages/
│   └── shared/              # Common types, schemas, utilities
├── docker-compose.yml       # Local development infrastructure
├── turbo.json               # Turborepo configuration
└── package.json             # Root package configuration
```

## 🔧 Configuration

### Environment Variables

Key configuration options:

- **Instagram API**: Access token for oEmbed integration
- **LLM Providers**: OpenAI/Anthropic API keys for content enrichment
- **Bot Integrations**: Telegram/Discord bot tokens
- **Database**: PostgreSQL connection string
- **Storage**: S3/MinIO configuration

### Feature Flags

Control functionality via environment variables:

- `ENABLE_LLM_ENRICHMENT`: Enable AI-powered content tagging
- `ENABLE_VECTOR_SEARCH`: Enable semantic search
- `ENABLE_BOT_INTEGRATIONS`: Enable bot webhooks
- `ENABLE_IMPORT_EXPORT`: Enable data import/export

## 📊 Performance Targets

- **Search**: p95 < 300ms for 10k items
- **Dashboard Load**: p95 < 1.5s
- **Bot Capture**: URL to visible card < 5s
- **Import**: 10k items processed in < 15 minutes

## 🔒 Security & Compliance

- **No Scraping**: Only uses official Instagram oEmbed API
- **Data Minimization**: Stores only URLs, captions, and derived metadata
- **Privacy Controls**: Full data deletion and export capabilities
- **Rate Limiting**: Prevents abuse and respects API limits

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:unit
pnpm test:integration
pnpm test:e2e

# Test with coverage
pnpm test:coverage
```

## 📚 API Documentation

The API includes automatic Swagger documentation at `/docs` when running in development mode.

### Key Endpoints

- `POST /import` - Import Instagram data export
- `POST /ingest` - Ingest single Instagram URL
- `GET /search` - Hybrid search with filters
- `GET /items` - List saved items
- `POST /collections` - Create collections
- `POST /items/:id/notes` - Add notes to items

## 🚀 Deployment

### Production Checklist

- [ ] Set production environment variables
- [ ] Configure production database with proper credentials
- [ ] Set up S3/MinIO with proper access controls
- [ ] Configure monitoring and alerting
- [ ] Set up CI/CD pipeline
- [ ] Configure rate limiting and security headers

### Docker Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Documentation**: Check the [docs](./docs) folder for detailed guides

## 🗺️ Roadmap

### MVP (v0.1)
- [x] Project setup and infrastructure
- [ ] Instagram export import
- [ ] Telegram/Discord bot integration
- [ ] Basic search and organization
- [ ] Web UI foundation

### V1 (v0.2)
- [ ] WhatsApp Business integration
- [ ] Instagram DM integration
- [ ] Advanced search features
- [ ] Mobile app (React Native)
- [ ] Performance optimization

### V2
- [ ] Multi-platform support (Twitter, YouTube, etc.)
- [ ] Collaboration features
- [ ] Advanced analytics
- [ ] Browser extension

---

Built with ❤️ for knowledge workers and content creators.
