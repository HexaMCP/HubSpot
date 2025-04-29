import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Client } from "@hubspot/api-client";
import { FilterOperatorEnum } from "@hubspot/api-client/lib/codegen/crm/contacts/index.js";
import * as dotenv from "dotenv";

dotenv.config();

// Initialize HubSpot client
const hubspotClient = new Client({
  accessToken: process.env.HUBSPOT_API_KEY,
  defaultHeaders: { 'Content-Type': 'application/json' },
});

// Create server instance
const server = new McpServer({
  name: "hubspot",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Register HubSpot tools
server.tool(
  "create-contact",
  "Create a new contact in HubSpot",
  {
    email: z.string().email().describe("Contact's email address"),
    firstName: z.string().optional().describe("Contact's first name"),
    lastName: z.string().optional().describe("Contact's last name"),
    phone: z.string().optional().describe("Contact's phone number"),
  },
  async ({ email, firstName, lastName, phone }) => {
    try {
      const properties: Record<string, string> = {
        email,
      };

      if (firstName) properties.firstname = firstName;
      if (lastName) properties.lastname = lastName;
      if (phone) properties.phone = phone;

      const response = await hubspotClient.crm.contacts.basicApi.create({
        properties,
      });

      return {
        content: [
          {
            type: "text",
            text: `Contact created successfully:\nID: ${response.id}\nEmail: ${email}\nName: ${firstName || ''} ${lastName || ''}`,
          },
        ],
      };
    } catch (error: any) {
      console.error("Error creating contact:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to create contact: ${error?.message || 'Unknown error'}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "get-contact",
  "Get a contact from HubSpot by email",
  {
    email: z.string().email().describe("Contact's email address to search for"),
  },
  async ({ email }) => {
    try {
      const searchRequest = {
        filterGroups: [
          {
            filters: [
              {
                propertyName: "email",
                operator: FilterOperatorEnum.Eq, // Correct enum type
                value: email,
              },
            ],
          },
        ],
        properties: ["email", "firstname", "lastname", "phone"],
        limit: 1,
      };

      const searchResponse = await hubspotClient.crm.contacts.searchApi.doSearch(searchRequest);

      if (searchResponse.results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No contact found with email: ${email}`,
            },
          ],
        };
      }

      const contact = searchResponse.results[0];
      return {
        content: [
          {
            type: "text",
            text: `Contact found:\nID: ${contact.id}\nEmail: ${contact.properties.email}\nName: ${contact.properties.firstname || ''} ${contact.properties.lastname || ''}\nPhone: ${contact.properties.phone || 'N/A'}`,
          },
        ],
      };
    } catch (error: any) {
      console.error("Error getting contact:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to get contact: ${error?.message || 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "search-contacts",
  "Search for contacts in HubSpot",
  {
    query: z.string().optional().describe("Optional search query"),
  },
  async ({ query }) => {
    try {
      const limit = 10;
      const properties = ['firstname', 'lastname', 'email', 'company', 'phone', 'createdate'];
      
      const response = await hubspotClient.crm.contacts.basicApi.getPage(
        limit,
        undefined,
        properties,
        undefined,
        undefined,
        false
      );

      const formattedContacts = response.results.map(contact => {
        const props = contact.properties;
        const createDate = props.createdate ? new Date(props.createdate) : new Date();
        return [
          `Contact ID: ${contact.id}`,
          `Name: ${props.firstname || ''} ${props.lastname || ''}`,
          `Email: ${props.email || 'N/A'}`,
          `Phone: ${props.phone || 'N/A'}`,
          `Created: ${createDate.toLocaleString()}`,
          '---'
        ].join('\n');
      }).join('\n\n');

      return {
        content: [
          {
            type: "text",
            text: `Last ${limit} contacts:\n\n${formattedContacts}`
          }
        ]
      };
    } catch (error: any) {
      console.error("Error searching contacts:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to search contacts: ${error?.message || 'Unknown error'}`
          }
        ]
      };
    }
  }
);

server.tool(
  "update-contact",
  "Update an existing contact in HubSpot",
  {
    contactId: z.string().describe("Contact's ID to update"),
    email: z.string().email().optional().describe("Updated email address"),
    firstName: z.string().optional().describe("Updated first name"),
    lastName: z.string().optional().describe("Updated last name"),
    phone: z.string().optional().describe("Updated phone number"),
  },
  async ({ contactId, email, firstName, lastName, phone }) => {
    try {
      const properties: Record<string, string> = {};

      if (email) properties.email = email;
      if (firstName) properties.firstname = firstName;
      if (lastName) properties.lastname = lastName;
      if (phone) properties.phone = phone;

      const response = await hubspotClient.crm.contacts.basicApi.update(contactId, { properties });

      return {
        content: [
          {
            type: "text",
            text: `Contact updated successfully:
ID: ${contactId}
Updated Properties: ${JSON.stringify(properties, null, 2)}`,
          },
        ],
      };
    } catch (error: any) {
      console.error("Error updating contact:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to update contact: ${error?.message || 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "delete-contact",
  "Delete/archive a contact from HubSpot",
  {
    contactId: z.string().describe("Contact's ID to delete"),
  },
  async ({ contactId }) => {
    try {
      await hubspotClient.crm.contacts.basicApi.archive(contactId);

      return {
        content: [
          {
            type: "text",
            text: `Contact with ID ${contactId} was successfully deleted.`,
          },
        ],
      };
    } catch (error: any) {
      console.error("Error deleting contact:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to delete contact: ${error?.message || 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "get-last-contacts",
  "Get the last 2 contacts from HubSpot",
  {},
  async () => {
    try {
      const limit = 2;
      const properties = ['firstname', 'lastname', 'email', 'company', 'phone', 'createdate'];
      
      const searchRequest = {
        filterGroups: [],
        properties,
        limit,
        sorts: ["createdate"]
      };
      
      const response = await hubspotClient.crm.contacts.searchApi.doSearch(searchRequest);

      const formattedContacts = response.results.map(contact => {
        const props = contact.properties;
        const createDate = props.createdate ? new Date(props.createdate) : new Date();
        return [
          `Contact ID: ${contact.id}`,
          `Name: ${props.firstname || ''} ${props.lastname || ''}`,
          `Email: ${props.email || 'N/A'}`,
          `Phone: ${props.phone || 'N/A'}`,
          `Created: ${createDate.toLocaleString()}`,
          '---'
        ].join('\n');
      }).join('\n\n');

      return {
        content: [
          {
            type: "text",
            text: `Last ${limit} contacts (sorted by creation date):\n\n${formattedContacts}`
          }
        ]
      };
    } catch (error: any) {
      console.error("Error getting last contacts:", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to get last contacts: ${error?.message || 'Unknown error'}`
          }
        ]
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("HubSpot MCP Server running on stdio");

  // Handle command line arguments for direct tool usage
  const [,, command, ...args] = process.argv;
  
  if (command === 'create-contact') {
    const email = args[0];
    const firstName = args[1];
    const lastName = args[2];
    const phone = args[3];
    
    if (!email) {
      console.error('Usage: node build/index.js create-contact [EMAIL] [FIRSTNAME] [LASTNAME] [PHONE]');
      console.error('Example: node build/index.js create-contact john@example.com John Doe +1234567890');
      process.exit(1);
    }
    
    try {
      const properties: Record<string, string> = {
        email,
      };

      if (firstName) properties.firstname = firstName;
      if (lastName) properties.lastname = lastName;
      if (phone) properties.phone = phone;

      const response = await hubspotClient.crm.contacts.basicApi.create({
        properties,
      });
      console.log(`Contact created successfully:\nID: ${response.id}\nEmail: ${email}\nName: ${firstName || ''} ${lastName || ''}`);
      process.exit(0);
    } catch (error: any) {
      console.error("Error creating contact:", error?.message || 'Unknown error');
      process.exit(1);
    }
  }
  else if (command === 'get-contact') {
    const email = args[0];
    
    if (!email) {
      console.error('Usage: node build/index.js get-contact [EMAIL]');
      console.error('Example: node build/index.js get-contact john@example.com');
      process.exit(1);
    }
    
    try {
      const searchRequest = {
        filterGroups: [
          {
            filters: [
              {
                propertyName: "email",
                operator: FilterOperatorEnum.Eq, // Correct enum type
                value: email,
              },
            ],
          },
        ],
        properties: ["email", "firstname", "lastname", "phone"],
        limit: 1,
      };

      const searchResponse = await hubspotClient.crm.contacts.searchApi.doSearch(searchRequest);
      
      if (searchResponse.results.length === 0) {
        console.log(`No contact found with email: ${email}`);
        process.exit(0);
      }
      
      const contact = searchResponse.results[0];
      console.log(`Contact found:\nID: ${contact.id}\nEmail: ${contact.properties.email}\nName: ${contact.properties.firstname || ''} ${contact.properties.lastname || ''}\nPhone: ${contact.properties.phone || 'N/A'}`);
      process.exit(0);
    } catch (error: any) {
      console.error("Error getting contact:", error?.message || 'Unknown error');
      process.exit(1);
    }
  }
  else if (command === 'delete-contact') {
    const contactId = args[0];

    if (!contactId) {
      console.error('Usage: node build/index.js delete-contact [CONTACT_ID]');
      console.error('Example: node build/index.js delete-contact 12345');
      process.exit(1);
    }

    try {
      await hubspotClient.crm.contacts.basicApi.archive(contactId);
      console.log(`Contact with ID ${contactId} deleted successfully.`);
      process.exit(0);
    } catch (error: any) {
      console.error("Error deleting contact:", error?.message || 'Unknown error');
      process.exit(1);
    }
  }
  else if (command === 'search-contacts') {
    try {
      const limit = 10;
      const properties = ['firstname', 'lastname', 'email', 'company', 'phone', 'createdate'];
      
      const response = await hubspotClient.crm.contacts.basicApi.getPage(
        limit,
        undefined,
        properties,
        undefined,
        undefined,
        false
      );

      console.log('\nLast 10 contacts:\n');
      response.results.forEach(contact => {
        const props = contact.properties;
        const createDate = props.createdate ? new Date(props.createdate) : new Date();
        console.log(`Contact ID: ${contact.id}`);
        console.log(`Name: ${props.firstname || ''} ${props.lastname || ''}`);
        console.log(`Email: ${props.email || 'N/A'}`);
        console.log(`Phone: ${props.phone || 'N/A'}`);
        console.log(`Created: ${createDate.toLocaleString()}`);
        console.log('---\n');
      });
      process.exit(0);
    } catch (error: any) {
      console.error("Error searching contacts:", error?.message || 'Unknown error');
      process.exit(1);
    }
  }
  else if (command === 'update-contact') {
    const [contactId, ...updateArgs] = args;
    
    if (!contactId) {
      console.error('Usage: node build/index.js update-contact [CONTACT_ID] --email [EMAIL] --firstName [FIRSTNAME] --lastName [LASTNAME] --phone [PHONE]');
      console.error('Example: node build/index.js update-contact 12345 --email new@example.com --firstName John --lastName Doe --phone +1234567890');
      process.exit(1);
    }

    try {
      const properties: Record<string, string> = {};
      
      for (let i = 0; i < updateArgs.length; i += 2) {
        const flag = updateArgs[i];
        const value = updateArgs[i + 1];
        
        if (!value) continue;
        
        switch (flag) {
          case '--email':
            properties.email = value;
            break;
          case '--firstName':
            properties.firstname = value;
            break;
          case '--lastName':
            properties.lastname = value;
            break;
          case '--phone':
            properties.phone = value;
            break;
        }
      }

      await hubspotClient.crm.contacts.basicApi.update(contactId, { properties });
      console.log(`Contact updated successfully:\nID: ${contactId}\nUpdated Properties: ${JSON.stringify(properties, null, 2)}`);
      process.exit(0);
    } catch (error: any) {
      console.error("Error updating contact:", error?.message || 'Unknown error');
      process.exit(1);
    }
  }
  else if (command === 'get-last-contacts') {
    try {
      const limit = 2;
      const properties = ['firstname', 'lastname', 'email', 'company', 'phone', 'createdate'];
      
      const searchRequest = {
        filterGroups: [],
        properties,
        limit,
        sorts: ["createdate"]
      };
      
      const response = await hubspotClient.crm.contacts.searchApi.doSearch(searchRequest);

      console.log('\nLast 2 contacts (sorted by creation date):\n');
      response.results.forEach(contact => {
        const props = contact.properties;
        const createDate = props.createdate ? new Date(props.createdate) : new Date();
        console.log(`Contact ID: ${contact.id}`);
        console.log(`Name: ${props.firstname || ''} ${props.lastname || ''}`);
        console.log(`Email: ${props.email || 'N/A'}`);
        console.log(`Phone: ${props.phone || 'N/A'}`);
        console.log(`Created: ${createDate.toLocaleString()}`);
        console.log('---\n');
      });
      process.exit(0);
    } catch (error: any) {
      console.error("Error getting last contacts:", error?.message || 'Unknown error');
      process.exit(1);
    }
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});