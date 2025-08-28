# Instagram Saves Knowledge Dashboard - Development Todo List

## Phase 0: Infrastructure & Setup ✅
- [x] **Project Setup**
  - [x] Initialize monorepo with pnpm + Turborepo
  - [x] Set up Next.js 15 project with App Router
  - [x] Configure TypeScript end-to-end
  - [x] Set up ESLint, Prettier, and Husky
  - [x] Create basic folder structure (web, api, workers, shared)

- [x] **Database & Storage**
  - [x] Set up PostgreSQL with pgvector extension
  - [x] Create database schema (users, items, item_content, item_enrichment, item_embeddings, collections, notes, jobs, audit_log)
  - [x] Set up Redis for job queues and caching
  - [x] Configure S3-compatible object store for import files and thumbnails
  - [x] Set up database migrations and seeding

- [x] **Search Infrastructure**
  - [x] Install and configure Meilisearch for BM25 search
  - [x] Set up pgvector for embeddings storage
  - [x] Create hybrid search implementation

- [x] **CI/CD & DevOps**
  - [x] Set up GitHub Actions or similar CI/CD pipeline
  - [x] Configure environment management and secret manager
  - [x] Set up feature flags system
  - [x] Create Docker configurations for local development

## Phase 1: Ingestion & Hydration
- [ ] **Import System**
  - [ ] Create import endpoint (`POST /import`) for ZIP/JSON uploads
  - [ ] Build IG data export parser (handle schema drift)
  - [ ] Implement de-duplication by normalized permalink/post ID
  - [ ] Create import progress tracking (`GET /import/:id/status`)
  - [ ] Handle import failures gracefully with user feedback

- [ ] **Bot Integration (MVP)**
  - [ ] Set up Telegram webhook (`/webhook/telegram`)
  - [ ] Set up Discord webhook (`/webhook/discord`)
  - [ ] Implement URL validation and parsing
  - [ ] Create bot response handlers (ACK messages)
  - [ ] Build URL ingestion endpoint (`POST /ingest`)

- [ ] **Instagram oEmbed Integration**
  - [ ] Set up Meta app for Instagram API access
  - [ ] Create oEmbed client with rate limiting
  - [ ] Implement caching for HTML + metadata
  - [ ] Handle private/deleted posts gracefully
  - [ ] Build hydration job queue system

- [ ] **Core Data Models**
  - [ ] Implement user authentication system
  - [ ] Create item creation and management APIs
  - [ ] Build item detail endpoint (`GET /items/:id`)
  - [ ] Implement item listing with filters (`GET /items`)

## Phase 2: Parsing & Indexing
- [ ] **Content Parsing**
  - [ ] Build caption text extractor (strip HTML)
  - [ ] Implement hashtag and mention extraction
  - [ ] Create URL extraction from captions
  - [ ] Add language detection
  - [ ] Build content normalization pipeline

- [ ] **LLM Enrichment System**
  - [ ] Set up LLM provider integration (provider-agnostic)
  - [ ] Create topic extraction with controlled vocabulary
  - [ ] Implement keyword generation (5-12 terms, max 2 words each)
  - [ ] Build entity extraction (brands, people, places)
  - [ ] Add quality classification (how-to, tutorial, review, etc.)
  - [ ] Implement confidence scoring and fallback mechanisms
  - [ ] Create batch processing for 100-500 items per job
  - [ ] Add caption hash caching to avoid re-processing

- [ ] **Vector Embeddings**
  - [ ] Set up embedding model integration
  - [ ] Generate embeddings for captions + hashtags + creator
  - [ ] Store embeddings in pgvector
  - [ ] Implement embedding similarity search

- [ ] **Search Indexing**
  - [ ] Index content in Meilisearch (BM25)
  - [ ] Set up vector search in pgvector
  - [ ] Create hybrid search ranking algorithm
  - [ ] Implement search result highlighting

## Phase 3: Search & Organization
- [ ] **Hybrid Search API**
  - [ ] Build search endpoint (`GET /search`)
  - [ ] Implement BM25 + vector cosine hybrid retrieval
  - [ ] Create query rewrite with synonym table
  - [ ] Add faceted filtering (topics, creator, media type, date, language)
  - [ ] Implement cursor-based pagination
  - [ ] Add search result ranking and scoring

- [ ] **Organization Features**
  - [ ] Create collections management (`POST /collections`)
  - [ ] Implement collection-item relationships
  - [ ] Build tagging system
  - [ ] Create notes system (`POST /items/:id/notes`)
  - [ ] Implement batch tagging operations
  - [ ] Add collection filtering in search

- [ ] **User Management**
  - [ ] Build user profile and settings
  - [ ] Implement data export functionality
  - [ ] Create account deletion (`DELETE /account`)
  - [ ] Add per-item deletion (`DELETE /items/:id`)
  - [ ] Implement audit logging

## Phase 4: Web UI & Mobile App
- [ ] **Next.js Web Application**
  - [ ] Create responsive grid layout for saved posts
  - [ ] Build search interface with filters
  - [ ] Implement detail pane for post information
  - [ ] Add collections and tags management UI
  - [ ] Create notes editor
  - [ ] Build import flow with progress indicators
  - [ ] Implement keyboard navigation (⌘K global search, arrows, shortcuts)
  - [ ] Add high-contrast theme support
  - [ ] Create responsive design for mobile browsers

- [ ] **React Native Mobile App**
  - [ ] Set up Expo or bare React Native project
  - [ ] Implement share sheet integration for sending links
  - [ ] Create deep linking to open item details
  - [ ] Build mobile-optimized gallery view
  - [ ] Add offline support for cached content
  - [ ] Implement push notifications for new saves

- [ ] **Performance Optimization**
  - [ ] Implement cached thumbnails system
  - [ ] Add lazy loading for images
  - [ ] Optimize bundle size and code splitting
  - [ ] Implement service worker for offline functionality
  - [ ] Add performance monitoring and metrics

## Phase 5: V1 Polish & Advanced Features
- [ ] **Additional Bot Integrations**
  - [ ] Implement WhatsApp Business DM capture
  - [ ] Add Instagram DM integration (Professional accounts)
  - [ ] Create webhook validation and security

- [ ] **Insights & Analytics**
  - [ ] Build topic analysis dashboard
  - [ ] Create creator insights
  - [ ] Implement weekly summary reports
  - [ ] Add search analytics and trends

- [ ] **Advanced Search Features**
  - [ ] Create timeline view
  - [ ] Implement synonym table management
  - [ ] Add query rewrite capabilities
  - [ ] Build advanced filtering options

- [ ] **Export & Sharing**
  - [ ] Create shareable views (export links)
  - [ ] Implement CSV/JSON export functionality
  - [ ] Add basic multi-user support (read-only invites)

## Phase 6: Testing & Quality Assurance
- [ ] **Unit Testing**
  - [ ] Test URL parser and validation
  - [ ] Test de-duplication logic
  - [ ] Test caption parsing and extraction
  - [ ] Test synonym rewrite functionality
  - [ ] Test ranking algorithms

- [ ] **Integration Testing**
  - [ ] Test oEmbed integration with stubs
  - [ ] Test LLM tagger with mocked responses
  - [ ] Test vector and BM25 search queries
  - [ ] Test job queue processing

- [ ] **Load Testing**
  - [ ] Test hydration of 10k items
  - [ ] Test search performance under load (50 QPS)
  - [ ] Verify p95 latency targets
  - [ ] Test import throughput

- [ ] **Acceptance Testing**
  - [ ] Test real IG export import (95%+ success rate)
  - [ ] Test bot URL capture (≤5s visibility)
  - [ ] Test search functionality with real queries
  - [ ] Test organization features (collections, notes, tags)
  - [ ] Test data deletion workflows

## Phase 7: Documentation & Deployment
- [ ] **User Documentation**
  - [ ] Create "How to export IG data" guide
  - [ ] Write "Share to bot" instructions
  - [ ] Build help center and FAQ
  - [ ] Create privacy policy and terms of service

- [ ] **Developer Documentation**
  - [ ] Write API documentation
  - [ ] Create deployment guides
  - [ ] Document system architecture
  - [ ] Add code comments and README files

- [ ] **Production Deployment**
  - [ ] Set up production environment
  - [ ] Configure monitoring and alerting
  - [ ] Implement logging and observability
  - [ ] Set up backup and disaster recovery
  - [ ] Configure rate limiting and security

## Phase 8: Launch & Iteration
- [ ] **Alpha Testing**
  - [ ] Internal testing with 5-10 users
  - [ ] Manual evaluation of topic precision
  - [ ] Performance optimization based on feedback
  - [ ] Bug fixes and stability improvements

- [ ] **Closed Beta**
  - [ ] Expand to larger user group
  - [ ] Add Discord integration
  - [ ] Implement insights dashboard
  - [ ] Instrument KPIs and metrics

- [ ] **Public Beta (V1)**
  - [ ] Launch public beta
  - [ ] Add WhatsApp Business integration
  - [ ] Implement Instagram DM capture
  - [ ] Create landing page
  - [ ] Monitor and respond to user feedback

## Current Status: Phase 1 - Ingestion & Hydration
**Next Action**: Set up Instagram oEmbed integration and create import endpoints

## Notes & Dependencies
- Instagram oEmbed requires Meta app approval
- LLM costs estimated at $0.10-$0.40 per 100 posts
- Performance targets: p95 search < 300ms, p95 dashboard load < 1.5s
- Security: No scraping, only user-provided data and official APIs
- Scalability: Single-tenant up to 100k items/user initially
