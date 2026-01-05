import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { property } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a premium real estate copywriter specializing in luxury properties in Ho Chi Minh City, Vietnam. 
Write compelling, professional property descriptions in English that highlight:
- Key features and amenities
- Location advantages and neighborhood benefits
- Investment potential and lifestyle benefits
- Unique selling points

Keep descriptions concise (150-200 words), professional, and appealing to international buyers and renters.
Do NOT use generic phrases. Be specific and authentic.`;

    const userPrompt = `Write a compelling English property description for:

Title: ${property.title}
Type: ${property.property_type || 'Apartment'}
Location: ${property.district || property.location_area || 'Ho Chi Minh City'}
Bedrooms: ${property.bedrooms || 'Studio'}
Bathrooms: ${property.bathrooms || 1}
Area: ${property.area_sqft || 'N/A'} sqm
Price: ${property.price ? property.price.toLocaleString() + ' VND' : 'Contact for price'}
Purpose: ${property.purpose === 'for-rent' ? 'For Rent' : 'For Sale'}
Pets Allowed: ${property.pets_allowed ? 'Yes' : 'No'}

Generate a professional English description that would appeal to expats and international investors.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content || "";

    // Also generate a compelling English title
    const titleResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a real estate copywriter. Generate a short, compelling English property title (max 10 words). Be specific and professional. No quotes in output." },
          { role: "user", content: `Create an English title for: ${property.title}, ${property.bedrooms || 'Studio'} bedroom ${property.property_type || 'apartment'} in ${property.district || property.location_area || 'Ho Chi Minh City'}` },
        ],
        stream: false,
      }),
    });

    let englishTitle = property.title;
    if (titleResponse.ok) {
      const titleData = await titleResponse.json();
      englishTitle = titleData.choices?.[0]?.message?.content?.replace(/['"]/g, '').trim() || property.title;
    }

    return new Response(JSON.stringify({ 
      description, 
      englishTitle,
      success: true 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Error generating description:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error",
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
