import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'DealFlow AI - Backend API',
    version: '1.0.0',
    description:
      'High-performance backend API for DealFlow AI: Autonomous Deal Screener & Pitch Deck Evaluation for Angels & VCs.',
    contact: {
      name: 'DealFlow AI Engineering',
      email: 'engineering@dealflow.ai',
    },
  },
  servers: [
    {
      url: '/',
      description: 'Current Environment / Origin',
    },
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server (Port 5000)',
    },
    {
      url: 'http://localhost:5001',
      description: 'Local Development Server (Port 5001)',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token to authorize protected requests.',
      },
    },
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          timestamp: { type: 'string', example: '2026-10-25T11:45:00.000Z' },
          service: { type: 'string', example: 'dealflow-ai-backend' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password', 'firmName'],
        properties: {
          name: { type: 'string', example: 'Alexander Wright' },
          email: { type: 'string', format: 'email', example: 'partner@apexoffice.com' },
          password: { type: 'string', format: 'password', example: 'Password123!' },
          firmName: { type: 'string', example: 'Apex Family Office' },
          slug: {
            type: 'string',
            example: 'apex-family-office',
            description: 'Optional custom URL slug. If omitted, will be auto-generated from firmName.',
          },
          role: { type: 'string', example: 'Managing Partner' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'partner@apexoffice.com' },
          password: { type: 'string', format: 'password', example: 'Password123!' },
        },
      },
      UpdateThesisRequest: {
        type: 'object',
        properties: {
          firmName: { type: 'string', example: 'Apex Family Office' },
          targetSectors: {
            type: 'array',
            items: { type: 'string' },
            example: ['B2B SaaS', 'Fintech', 'AI / Enterprise Tech', 'HealthTech'],
          },
          minMonthlyRev: {
            type: 'number',
            example: 35000,
            description: 'Minimum monthly recurring revenue (MRR) threshold in USD.',
          },
          maxValuation: {
            type: 'number',
            example: 25000000,
            description: 'Maximum valuation cap in USD.',
          },
          preferredStage: {
            type: 'string',
            example: 'Seed',
            enum: ['Pre-Seed', 'Seed', 'Series A', 'Series B+'],
          },
          customCriteria: {
            type: 'string',
            example:
              'Targeting high-margin B2B SaaS companies with demonstrable traction, minimum $35k/mo MRR, strong NDR (>110%), and proprietary technical moats.',
          },
        },
      },
      UpdatePitchStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['TOP_1_PERCENT', 'REVIEW', 'REJECTED'],
            example: 'TOP_1_PERCENT',
            description: 'The updated status for deal pipeline triage.',
          },
        },
      },
      InvestorUser: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'c4b8e720-30db-4a9b-980b-19349899f121' },
          name: { type: 'string', example: 'Alexander Wright' },
          email: { type: 'string', example: 'partner@apexoffice.com' },
          firmName: { type: 'string', example: 'Apex Family Office' },
          slug: { type: 'string', example: 'apex-family-office' },
          role: { type: 'string', example: 'Managing Partner' },
          createdAt: { type: 'string', example: '2026-10-25T11:45:00.000Z' },
        },
      },
      InvestorThesis: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'f87a3cb2-990e-436c-901f-0b3281736aa5' },
          firmName: { type: 'string', example: 'Apex Family Office' },
          slug: { type: 'string', example: 'apex-family-office' },
          targetSectors: {
            type: 'array',
            items: { type: 'string' },
            example: ['B2B SaaS', 'Fintech', 'AI / Enterprise Tech', 'HealthTech'],
          },
          minMonthlyRev: { type: 'number', example: 35000 },
          maxValuation: { type: 'number', example: 25000000 },
          preferredStage: { type: 'string', example: 'Seed' },
          customCriteria: {
            type: 'string',
            example:
              'Targeting high-margin B2B SaaS companies with demonstrable traction, minimum $35k/mo MRR, strong NDR (>110%), and proprietary technical moats.',
          },
          investorId: { type: 'string', example: 'c4b8e720-30db-4a9b-980b-19349899f121' },
          createdAt: { type: 'string', example: '2026-10-25T11:45:00.000Z' },
          updatedAt: { type: 'string', example: '2026-10-25T11:50:00.000Z' },
        },
      },
      Pitch: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '7820a0b1-4c62-4264-b045-88e9988a2119' },
          startupName: { type: 'string', example: 'AgenticFlow' },
          tagline: {
            type: 'string',
            example: 'Autonomous Multi-Agent Workflow Engine for Enterprise Operations',
          },
          founderNames: { type: 'string', example: 'Elena Rostova, Marcus Vance' },
          founderEmail: { type: 'string', example: 'founders@agenticflow.ai' },
          sector: { type: 'string', example: 'AI / Enterprise Tech' },
          stage: { type: 'string', example: 'Seed' },
          reportedMrr: { type: 'number', example: 42000 },
          askAmount: { type: 'number', example: 2500000 },
          valuation: { type: 'number', example: 16000000 },
          extractedText: {
            type: 'string',
            nullable: true,
            example: 'Extracted executive summary text...',
          },
          matchScore: { type: 'integer', example: 94 },
          status: {
            type: 'string',
            enum: ['TOP_1_PERCENT', 'REVIEW', 'REJECTED'],
            example: 'TOP_1_PERCENT',
          },
          summary: {
            type: 'string',
            example:
              'AgenticFlow orchestrates mission-critical AI agent swarms for enterprise back-office workflows with provable deterministic safeguards.',
          },
          pros: {
            type: 'array',
            items: { type: 'string' },
            example: [
              'Exceeds MRR threshold ($42k vs $35k mandate)',
              'Proprietary deterministic state machine moat',
            ],
          },
          cons: {
            type: 'array',
            items: { type: 'string' },
            example: ['Valuation at top end of seed mandate ($16M)'],
          },
          redFlags: {
            type: 'array',
            items: { type: 'string' },
            example: [],
          },
          submittedAt: { type: 'string', example: '2026-10-25T11:55:00.000Z' },
          thesisId: { type: 'string', example: 'f87a3cb2-990e-436c-901f-0b3281736aa5' },
        },
      },
      PitchesResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          count: { type: 'integer', example: 1 },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Pitch' },
          },
        },
      },
      PitchStatusUpdateResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: "Pitch status successfully updated to 'TOP_1_PERCENT'.",
          },
          data: { $ref: '#/components/schemas/Pitch' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Investor registered successfully' },
          data: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
              user: { $ref: '#/components/schemas/InvestorUser' },
              thesisSlug: { type: 'string', example: 'apex-family-office' },
              thesis: { $ref: '#/components/schemas/InvestorThesis' },
            },
          },
        },
      },
      ProfileResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/InvestorUser' },
              thesis: { $ref: '#/components/schemas/InvestorThesis' },
            },
          },
        },
      },
      ThesisResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Investment thesis updated successfully' },
          data: { $ref: '#/components/schemas/InvestorThesis' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error description' },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        summary: 'Server Health Check',
        tags: ['System'],
        description: 'Verifies the server status, active timestamp, and connectivity.',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        summary: 'Register Investor & Setup Thesis',
        tags: ['Authentication'],
        description:
          'Creates a new investor account, auto-generates their unique slug from firm name, establishes default investment thesis criteria in PostgreSQL, and returns a signed 7-day JWT token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Investor successfully registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          400: {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          409: {
            description: 'Email already registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Investor Login',
        tags: ['Authentication'],
        description: 'Authenticates investor credentials and returns a signed JWT token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Successfully authenticated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/me': {
      get: {
        summary: 'Get Current Authenticated Profile & Thesis',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        description: 'Returns the currently authenticated investor profile and their configured thesis.',
        responses: {
          200: {
            description: 'Current investor profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProfileResponse' },
              },
            },
          },
          401: {
            description: 'Unauthorized - invalid or expired token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'Profile not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/thesis/{slug}': {
      get: {
        summary: 'Get Investment Thesis Mandate by Slug',
        tags: ['Thesis Mandate'],
        description:
          'Fetches the investment thesis criteria and mandate parameters for a specific investor firm slug. Publicly accessible for the Founder Submission Portal and protected dashboard reads.',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'The unique investor firm slug (e.g., apex-family-office)',
            example: 'apex-family-office',
          },
        ],
        responses: {
          200: {
            description: 'Investment thesis mandate details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ThesisResponse' },
              },
            },
          },
          404: {
            description: 'Investment thesis not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update Investment Thesis Mandate',
        tags: ['Thesis Mandate'],
        security: [{ bearerAuth: [] }],
        description:
          'Allows the authenticated investor to update their thesis parameters, including sectors, minimum MRR, maximum valuation, preferred stage, and AI gatekeeper criteria.',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'The unique investor firm slug to update',
            example: 'apex-family-office',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateThesisRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Thesis successfully updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ThesisResponse' },
              },
            },
          },
          400: {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          401: {
            description: 'Unauthorized - invalid or missing JWT token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: {
            description: 'Forbidden - user does not own this thesis',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'Thesis not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/pitches': {
      get: {
        summary: 'Fetch Deal Flow & Inbound Pitches',
        tags: ['Deal Flow & Pitches'],
        description:
          'Fetches all pitch submissions linked to a specific investor thesis slug, ordered by matchScore descending. Supports filtering by triage status and sector vertical.',
        parameters: [
          {
            name: 'slug',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description:
              'The investor firm slug (e.g., apex-family-office). Optional if authenticated with JWT.',
            example: 'apex-family-office',
          },
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['TOP_1_PERCENT', 'REVIEW', 'REJECTED'],
            },
            description: 'Filter by triage status',
            example: 'TOP_1_PERCENT',
          },
          {
            name: 'sector',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filter by startup sector vertical',
            example: 'AI / Enterprise Tech',
          },
        ],
        responses: {
          200: {
            description: 'List of pitch submissions',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PitchesResponse' },
              },
            },
          },
          400: {
            description: 'Missing slug parameter',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'Thesis slug not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/pitches/{id}/status': {
      patch: {
        summary: 'Update Pitch Triage Status',
        tags: ['Deal Flow & Pitches'],
        security: [{ bearerAuth: [] }],
        description:
          'Updates the evaluation status of a pitch (TOP_1_PERCENT, REVIEW, REJECTED). Verified against the authenticated investor thesis ownership.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'The unique UUID of the pitch submission',
            example: '7820a0b1-4c62-4264-b045-88e9988a2119',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdatePitchStatusRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Pitch status successfully updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PitchStatusUpdateResponse' },
              },
            },
          },
          400: {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          401: {
            description: 'Unauthorized - missing or invalid token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: {
            description: 'Forbidden - user does not own this pitch thesis',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'Pitch not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/pitches/submit/{slug}': {
      post: {
        summary: 'Public Founder Pitch Deck Submission & AI Gatekeeper Scoring',
        tags: ['Deal Flow & Pitches'],
        description:
          'Public intake portal for startup founders to submit their company pitch deck (PDF) alongside round details. Automatically parses deck text, evaluates against the investor mandate, and calculates the AI gatekeeper match score.',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'The unique investor firm slug (e.g., apex-family-office)',
            example: 'apex-family-office',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['startupName', 'founderNames', 'founderEmail', 'sector'],
                properties: {
                  startupName: { type: 'string', example: 'AgenticFlow' },
                  tagline: {
                    type: 'string',
                    example: 'Autonomous Multi-Agent Workflow Engine for Enterprise Operations',
                  },
                  founderNames: { type: 'string', example: 'Elena Rostova, Marcus Vance' },
                  founderEmail: {
                    type: 'string',
                    format: 'email',
                    example: 'founders@agenticflow.ai',
                  },
                  sector: { type: 'string', example: 'AI / Enterprise Tech' },
                  stage: { type: 'string', example: 'Seed' },
                  reportedMrr: {
                    type: 'number',
                    example: 45000,
                    description: 'Monthly recurring revenue (MRR) in USD',
                  },
                  askAmount: {
                    type: 'number',
                    example: 2500000,
                    description: 'Funding ask amount in USD',
                  },
                  valuation: {
                    type: 'number',
                    example: 16000000,
                    description: 'Target post-money valuation in USD',
                  },
                  pitchDeck: {
                    type: 'string',
                    format: 'binary',
                    description: 'Pitch Deck PDF file (max 15MB)',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Pitch successfully submitted and evaluated by AI gatekeeper',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example:
                        'Pitch deck submitted and evaluated by DealFlow AI gatekeeper successfully.',
                    },
                    data: { $ref: '#/components/schemas/Pitch' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation failed or invalid file format',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'Investor thesis not found for given slug',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({
  swaggerDefinition,
  apis: [],
});

export default swaggerSpec;
