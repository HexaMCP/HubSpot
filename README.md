# HubSpot MCP Server

A Node.js-based server that integrates with **HubSpot CRM** to perform **Create**, **Update**, and **Delete** operations on contacts using the **Model Context Protocol (MCP)**. This server serves as a bridge between MCP clients and the HubSpot Contacts API.

## 📌 Current Features

- 🆕 **Create Contact**
- 📄 **Get All Contacts**
- ⏮️ **Get Last 2 Contacts**

- ♻️ **Update Contact**
- ❌ **Delete Contact**
- 🔍 **Fetch Contact Details by Email or ID**

More HubSpot CRM operations will be added in future versions.

## 🛠️ Tech Stack

- **Backend**: Node.js
- **CRM API**: HubSpot CRM
- **Protocol**: Model Context Protocol (MCP)

# HubSpot MCP Integration

This repository provides a basic integration setup for **HubSpot API** using a custom **MCP server**. It allows you to perform contact management directly through MCP-compatible interfaces or tools.

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/HexaMCP/HubSpot.git
cd mcp-hubspot
```

### 2. Install Dependencies

```bash
npm install
```

## 🔐 3. Environment Setup

Create a `.env` file in the root directory with your HubSpot credentials:

```bash
HUBSPOT_API_KEY="your-hubspot-private-app-api-key"
PORT=3000
```

### 4. Start the MCP Server

```bash
npm start
```

Server will run on `http://localhost:3000` (or as configured).


### 5. Create a build file

```bash
npm run build
```

## ⚙️ MCP Configuration for STDIO

Configure your MCP client using a `mcp.json` file like below:

```json
{
  "servers": {
    "my-mcp-server-38b534a9": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/your/folder/path/mcp-hubspot/build/index.js"
      ]
    }
  }
}
```

## 👨‍💻 Author

Developed with ❤️ by [Blaze Web Services](https://blaze.ws)
