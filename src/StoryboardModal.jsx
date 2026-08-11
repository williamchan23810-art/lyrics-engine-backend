{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "StoryboardRequest",
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "artist": { "type": "string" },
    "lyrics": { "type": "string" }
  },
  "required": ["title", "lyrics"]
}
