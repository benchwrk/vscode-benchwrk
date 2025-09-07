# benchwrk

## VSCode Extension for Log Aggregation

[![BenchWrk](https://i.postimg.cc/NMfYwnxN/doc-2025-08-22-17-07-42.png)](https://benchwrk.com)

This VSCode extension designed to streamline log management across diverse sources. The extension enables developers to fetch, view, and analyze logs in real-time from platforms like Sentry (for error tracking), AWS CloudWatch (for cloud infrastructure logs), and Coolify (for deployment and container logs). Key features include:

- **Unified Dashboard**: Aggregate logs from multiple sources into a single VSCode panel for easy monitoring.
- **Real-Time Updates**: Automatically pull new logs without leaving your editor.

create a `sources.json` file in the root of your workspace with the following structure:

```json
{
  "sources": [
    {
      "id": "1",
      "name": "Coolify",
      "slug": "coolify",
      "type": "3rd-party",
      "config": {
        "server": "your.server.coolify.io",
        "endpoint": "/applications/{uuid}/logs",
        "accessKey": "your-access-key",
        "appId": "your-app-id"
      }
    }
  ]
}
```
