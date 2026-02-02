# Silent Partners JSON Import Format

This document describes the JSON format for importing network data into Silent Partners.

## Quick Start

The simplest valid JSON file contains just entities:

```json
{
  "entities": [
    { "id": "1", "name": "Elizabeth Holmes", "type": "person" },
    { "id": "2", "name": "Theranos", "type": "corporation" }
  ],
  "relationships": [
    { "id": "r1", "source": "1", "target": "2", "label": "founded" }
  ]
}
```

## Full Schema

### Root Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Network title (displayed in header) |
| `description` | string | No | Network description |
| `entities` | array | **Yes** | Array of entity objects |
| `relationships` | array | **Yes** | Array of relationship objects |
| `investigationContext` | object | No | Investigation context metadata |

### Entity Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | **Yes** | Unique identifier for the entity |
| `name` | string | **Yes** | Display name of the entity |
| `type` | string | No | Entity type (defaults to "unknown") |
| `description` | string | No | Detailed description |
| `importance` | number | No | Importance score (1-10, default 5) |
| `x` | number | No | Initial X position on canvas |
| `y` | number | No | Initial Y position on canvas |

#### Valid Entity Types

- `person` - Individual people
- `corporation` - Companies and businesses
- `organization` - Non-profit organizations, NGOs
- `financial` - Banks, investment firms, funds
- `government` - Government agencies and bodies
- `event` - Significant events or incidents
- `location` - Physical places
- `asset` - Physical or financial assets
- `unknown` - Unclassified entities (default)

### Relationship Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | No | Unique identifier (auto-generated if missing) |
| `source` | string | **Yes** | ID of the source entity |
| `target` | string | **Yes** | ID of the target entity |
| `type` | string | No | Relationship category |
| `label` | string | No | Display label for the connection |
| `status` | string | No | Relationship status |
| `strength` | number | No | Connection strength (0-1) |
| `startDate` | string | No | When relationship began |
| `endDate` | string | No | When relationship ended |

#### Valid Relationship Statuses

- `confirmed` - Verified relationship (solid line)
- `suspected` - Unverified relationship (dashed line)
- `former` - Past relationship (dotted line)

### Investigation Context Object (Optional)

| Field | Type | Description |
|-------|------|-------------|
| `topic` | string | Main investigation topic |
| `domain` | string | Domain area (e.g., "corporate fraud") |
| `focus` | string | Specific focus of investigation |
| `keyQuestions` | array | List of key questions to answer |

## Complete Example

```json
{
  "title": "Theranos Fraud Investigation",
  "description": "Mapping the network of people and organizations involved in the Theranos fraud case.",
  "entities": [
    {
      "id": "holmes",
      "name": "Elizabeth Holmes",
      "type": "person",
      "description": "Founder and CEO of Theranos",
      "importance": 10
    },
    {
      "id": "balwani",
      "name": "Ramesh Balwani",
      "type": "person",
      "description": "COO of Theranos",
      "importance": 8
    },
    {
      "id": "theranos",
      "name": "Theranos, Inc.",
      "type": "corporation",
      "description": "Blood testing startup founded in 2003",
      "importance": 10
    },
    {
      "id": "walgreens",
      "name": "Walgreens",
      "type": "corporation",
      "description": "Retail pharmacy partner",
      "importance": 6
    },
    {
      "id": "sec",
      "name": "U.S. Securities and Exchange Commission",
      "type": "government",
      "description": "Federal regulatory agency",
      "importance": 7
    }
  ],
  "relationships": [
    {
      "id": "r1",
      "source": "holmes",
      "target": "theranos",
      "type": "leadership",
      "label": "founded and led",
      "status": "confirmed"
    },
    {
      "id": "r2",
      "source": "balwani",
      "target": "theranos",
      "type": "leadership",
      "label": "COO",
      "status": "former",
      "startDate": "2009",
      "endDate": "2016"
    },
    {
      "id": "r3",
      "source": "holmes",
      "target": "balwani",
      "type": "personal",
      "label": "romantic relationship",
      "status": "former"
    },
    {
      "id": "r4",
      "source": "theranos",
      "target": "walgreens",
      "type": "business",
      "label": "partnership",
      "status": "former"
    },
    {
      "id": "r5",
      "source": "sec",
      "target": "holmes",
      "type": "legal",
      "label": "charged with fraud",
      "status": "confirmed"
    }
  ],
  "investigationContext": {
    "topic": "Theranos Fraud",
    "domain": "corporate fraud",
    "focus": "Leadership and enablers",
    "keyQuestions": [
      "Who enabled the fraud to continue?",
      "What was the role of the board?",
      "How did investors miss the red flags?"
    ]
  }
}
```

## Import Behavior

### Merge Mode
When importing with "Add to existing network":
- Entities with duplicate names are skipped
- New entities are added with fresh IDs if there's a conflict
- Relationships are added if they don't already exist between the same entities

### Replace Mode
When importing with "Replace current network":
- All existing entities and relationships are cleared
- The imported data becomes the new network
- Title and description are updated if provided

## Tips

1. **Use meaningful IDs** - IDs like `"holmes"` are easier to work with than `"entity-123"`
2. **Set importance** - Higher importance (8-10) makes entities more prominent in the visualization
3. **Include descriptions** - Descriptions appear in entity cards and help with AI analysis
4. **Use relationship labels** - Labels describe the nature of the connection
5. **Mark status** - Use `suspected` for unverified connections to show them differently

## Validation

The import validates:
- Required fields (`id`, `name` for entities; `source`, `target` for relationships)
- Entity type values (invalid types default to "unknown")
- Relationship status values (invalid statuses default to "confirmed")
- Relationship references (warns if source/target doesn't exist)

## Exporting

To export your current network as JSON:
1. Click the Share/Export button in the toolbar
2. Select "Export JSON"
3. The downloaded file will match this format exactly
