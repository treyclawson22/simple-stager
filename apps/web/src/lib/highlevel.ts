/**
 * GoHighLevel CRM API Client
 * 
 * Handles lead creation, contact updates, and pipeline management
 * for automatic CRM integration when users sign up and subscribe
 */

interface HighLevelContact {
  firstName?: string
  lastName?: string
  name?: string
  email: string
  phone?: string
  address1?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  source?: string
  tags?: string[]
  customFields?: Record<string, any>
  companyName?: string
}

interface HighLevelContactResponse {
  contact: {
    id: string
    firstName?: string
    lastName?: string
    email: string
    phone?: string
    tags?: string[]
    dateAdded: string
    dateUpdated: string
  }
}

interface PipelineStage {
  id: string
  name: string
  position: number
}

interface OpportunityData {
  title: string
  status: 'open' | 'won' | 'lost' | 'abandoned'
  stageId: string
  pipelineId: string
  contactId: string
  monetaryValue?: number
  name?: string
  source?: string
}

class HighLevelClient {
  private baseUrl = 'https://services.leadconnectorhq.com'
  private apiKey: string
  
  constructor() {
    this.apiKey = process.env.HIGHLEVEL_API_KEY || ''
    
    if (!this.apiKey) {
      console.warn('HighLevel API key not configured. Lead sync will be disabled.')
    }
  }

  private async makeRequest<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET', data?: any): Promise<T> {
    if (!this.apiKey) {
      throw new Error('HighLevel API key not configured')
    }

    const url = `${this.baseUrl}${endpoint}`
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    }

    const config: RequestInit = {
      method,
      headers
    }

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`HighLevel API error (${response.status}):`, errorText)
        throw new Error(`HighLevel API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('HighLevel API request failed:', error)
      throw error
    }
  }

  /**
   * Check if a contact exists by email
   */
  async findContactByEmail(email: string): Promise<HighLevelContactResponse | null> {
    try {
      const response = await this.makeRequest<{ contacts: HighLevelContactResponse[] }>(`/contacts/?email=${encodeURIComponent(email)}`)
      
      if (response.contacts && response.contacts.length > 0) {
        return response.contacts[0]
      }
      
      return null
    } catch (error) {
      console.error('Error finding contact by email:', error)
      return null
    }
  }

  /**
   * Create a new contact/lead in HighLevel
   */
  async createContact(contactData: HighLevelContact): Promise<HighLevelContactResponse | null> {
    try {
      const response = await this.makeRequest<HighLevelContactResponse>('/contacts/', 'POST', contactData)
      console.log('HighLevel contact created:', response.contact.id)
      return response
    } catch (error) {
      console.error('Error creating HighLevel contact:', error)
      return null
    }
  }

  /**
   * Update an existing contact in HighLevel
   */
  async updateContact(contactId: string, updateData: Partial<HighLevelContact>): Promise<HighLevelContactResponse | null> {
    try {
      const response = await this.makeRequest<HighLevelContactResponse>(`/contacts/${contactId}`, 'PUT', updateData)
      console.log('HighLevel contact updated:', contactId)
      return response
    } catch (error) {
      console.error('Error updating HighLevel contact:', error)
      return null
    }
  }

  /**
   * Add tags to a contact
   */
  async addTagsToContact(contactId: string, tags: string[]): Promise<boolean> {
    try {
      await this.makeRequest(`/contacts/${contactId}/tags`, 'POST', { tags })
      console.log('Tags added to contact:', contactId, tags)
      return true
    } catch (error) {
      console.error('Error adding tags to contact:', error)
      return false
    }
  }

  /**
   * Get available pipelines
   */
  async getPipelines(): Promise<any[]> {
    try {
      const response = await this.makeRequest<{ pipelines: any[] }>('/opportunities/pipelines')
      return response.pipelines || []
    } catch (error) {
      console.error('Error fetching pipelines:', error)
      return []
    }
  }

  /**
   * Create an opportunity for a contact in a specific pipeline/funnel
   */
  async createOpportunity(opportunityData: OpportunityData): Promise<any | null> {
    try {
      const response = await this.makeRequest<any>('/opportunities/', 'POST', opportunityData)
      console.log('HighLevel opportunity created:', response.opportunity?.id)
      return response
    } catch (error) {
      console.error('Error creating HighLevel opportunity:', error)
      return null
    }
  }

  /**
   * Move an opportunity to a different stage
   */
  async updateOpportunityStage(opportunityId: string, stageId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/opportunities/${opportunityId}`, 'PUT', { stageId })
      console.log('Opportunity stage updated:', opportunityId, stageId)
      return true
    } catch (error) {
      console.error('Error updating opportunity stage:', error)
      return false
    }
  }
}

// High Level CRM Integration Functions
export class HighLevelCRM {
  private client: HighLevelClient

  constructor() {
    this.client = new HighLevelClient()
  }

  /**
   * Process new user signup - create or update lead in HighLevel
   */
  async processSignup(userData: {
    email: string
    name?: string
    firstName?: string
    lastName?: string
    phone?: string
  }): Promise<{ success: boolean; contactId?: string; isNewLead?: boolean }> {
    try {
      // Check if contact already exists
      const existingContact = await this.client.findContactByEmail(userData.email)
      
      const contactData: HighLevelContact = {
        email: userData.email,
        firstName: userData.firstName || userData.name?.split(' ')[0],
        lastName: userData.lastName || userData.name?.split(' ').slice(1).join(' '),
        name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        phone: userData.phone,
        source: 'Simple Stager App',
        tags: ['Simple Stager User', 'Created Account'],
        customFields: {
          'signup_date': new Date().toISOString(),
          'source': 'Simple Stager Signup'
        }
      }

      if (existingContact) {
        // Update existing contact
        const updatedContact = await this.client.updateContact(existingContact.contact.id, {
          ...contactData,
          tags: [...(existingContact.contact.tags || []), ...contactData.tags!]
        })
        
        return {
          success: true,
          contactId: existingContact.contact.id,
          isNewLead: false
        }
      } else {
        // Create new contact
        const newContact = await this.client.createContact(contactData)
        
        if (newContact) {
          return {
            success: true,
            contactId: newContact.contact.id,
            isNewLead: true
          }
        }
      }
      
      return { success: false }
    } catch (error) {
      console.error('Error processing signup in HighLevel:', error)
      return { success: false }
    }
  }

  /**
   * Process subscription purchase - move lead to paid funnel
   */
  async processSubscription(userData: {
    email: string
    planName: string
    amount?: number
  }): Promise<{ success: boolean; opportunityId?: string }> {
    try {
      // Find the contact
      const existingContact = await this.client.findContactByEmail(userData.email)
      
      if (!existingContact) {
        console.error('Contact not found for subscription processing:', userData.email)
        return { success: false }
      }

      // Add subscription tags
      await this.client.addTagsToContact(existingContact.contact.id, [
        'Simple Stager Subscriber',
        `Plan: ${userData.planName}`,
        'Paid Customer'
      ])

      // Get pipelines to find the right one
      const pipelines = await this.client.getPipelines()
      const simpleStagerPipeline = pipelines.find(p => 
        p.name?.toLowerCase().includes('simple stager') || 
        p.name?.toLowerCase().includes('simple-stager')
      )

      if (simpleStagerPipeline) {
        // Find the "signed up for a plan - closed" stage
        const closedStage = simpleStagerPipeline.stages?.find((stage: PipelineStage) =>
          stage.name.toLowerCase().includes('signed up') && 
          stage.name.toLowerCase().includes('closed')
        )

        if (closedStage) {
          // Create opportunity in the closed stage
          const opportunity = await this.client.createOpportunity({
            title: `Simple Stager ${userData.planName} Plan`,
            status: 'won',
            stageId: closedStage.id,
            pipelineId: simpleStagerPipeline.id,
            contactId: existingContact.contact.id,
            monetaryValue: userData.amount,
            source: 'Simple Stager Subscription'
          })

          return {
            success: true,
            opportunityId: opportunity?.opportunity?.id
          }
        }
      }

      return { success: true } // Still success even if pipeline/stage not found
    } catch (error) {
      console.error('Error processing subscription in HighLevel:', error)
      return { success: false }
    }
  }

  /**
   * Add contact to "Created Account" funnel in Simple Stager pipeline
   */
  async addToCreatedAccountFunnel(contactId: string): Promise<boolean> {
    try {
      const pipelines = await this.client.getPipelines()
      const simpleStagerPipeline = pipelines.find(p => 
        p.name?.toLowerCase().includes('simple stager') || 
        p.name?.toLowerCase().includes('simple-stager')
      )

      if (simpleStagerPipeline) {
        // Find the "created an account" stage
        const accountStage = simpleStagerPipeline.stages?.find((stage: PipelineStage) =>
          stage.name.toLowerCase().includes('created') && 
          stage.name.toLowerCase().includes('account')
        )

        if (accountStage) {
          const opportunity = await this.client.createOpportunity({
            title: 'Simple Stager Account Created',
            status: 'open',
            stageId: accountStage.id,
            pipelineId: simpleStagerPipeline.id,
            contactId: contactId,
            source: 'Simple Stager Account Creation'
          })

          return !!opportunity
        }
      }

      return false
    } catch (error) {
      console.error('Error adding to created account funnel:', error)
      return false
    }
  }
}

// Export singleton instance
export const highLevelCRM = new HighLevelCRM()

// Export client for direct access if needed
export { HighLevelClient }