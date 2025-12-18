import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// POST /api/v1/webhooks/register - Register a webhook
export async function POST(request: Request) {
    try {
        const apiKey = request.headers.get('x-api-key')

        if (!apiKey || apiKey !== process.env.API_KEY) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()

        // Validate
        if (!body.url || !body.events) {
            return NextResponse.json(
                { error: 'Bad Request', message: 'URL and events are required' },
                { status: 400 }
            )
        }

        // Store webhook in database
        const { data, error } = await supabase
            .from('webhooks')
            .insert([{
                url: body.url,
                events: body.events, // ['machine.created', 'machine.updated', etc.]
                secret: generateWebhookSecret(),
                active: true
            }])
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({
            success: true,
            data,
            message: 'Webhook registered successfully'
        }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Internal Server Error', message: error.message },
            { status: 500 }
        )
    }
}

// Helper function to generate webhook secret
function generateWebhookSecret(): string {
    return `whsec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
}

// Function to trigger webhooks (call this when events occur)
export async function triggerWebhook(event: string, data: any) {
    try {
        // Get all webhooks listening to this event
        const { data: webhooks } = await supabase
            .from('webhooks')
            .select('*')
            .contains('events', [event])
            .eq('active', true)

        if (!webhooks || webhooks.length === 0) return

        // Send to all registered webhooks
        const promises = webhooks.map(async (webhook) => {
            try {
                const payload = {
                    event,
                    data,
                    timestamp: new Date().toISOString()
                }

                const signature = createSignature(payload, webhook.secret)

                await fetch(webhook.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Webhook-Signature': signature,
                        'X-Webhook-Event': event
                    },
                    body: JSON.stringify(payload)
                })
            } catch (error) {
                console.error(`Failed to send webhook to ${webhook.url}:`, error)
            }
        })

        await Promise.allSettled(promises)
    } catch (error) {
        console.error('Error triggering webhooks:', error)
    }
}

// Create signature for webhook verification
function createSignature(payload: any, secret: string): string {
    // In production, use crypto.createHmac('sha256', secret)
    const crypto = require('crypto')
    return crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex')
}
