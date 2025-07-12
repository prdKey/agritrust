'use server';
/**
 * @fileOverview A market analysis AI agent.
 *
 * - marketAnalysis - A function that handles the market analysis process.
 * - MarketAnalysisInput - The input type for the marketAnalysis function.
 * - MarketAnalysisOutput - The return type for the marketAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MarketAnalysisInputSchema = z.object({
  products: z.array(z.object({
    name: z.string(),
    price: z.string(),
    unit: z.string(),
    stock: z.string(),
  })).describe("A list of the farmer's products."),
});
export type MarketAnalysisInput = z.infer<typeof MarketAnalysisInputSchema>;

const MarketAnalysisOutputSchema = z.object({
  report: z.string().describe("A comprehensive market analysis report in Markdown format. It should include sections for Market Trends, Price Analysis, Supply and Demand, Weather Impact, and Actionable Recommendations."),
});
export type MarketAnalysisOutput = z.infer<typeof MarketAnalysisOutputSchema>;

export async function marketAnalysis(input: MarketAnalysisInput): Promise<MarketAnalysisOutput> {
  return marketAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'marketAnalysisPrompt',
  input: {schema: MarketAnalysisInputSchema},
  output: {schema: MarketAnalysisOutputSchema},
  prompt: `You are an expert agricultural market analyst. Your task is to provide a detailed market analysis for a farmer based on their current product listings. The analysis should be in Markdown format.

Analyze the following products:
{{#each products}}
- **{{name}}**: Price: {{price}} AGT per {{unit}}, Stock: {{stock}}
{{/each}}

Based on this data and general knowledge of agricultural markets, generate a report with the following sections:

### Market Trends
- Discuss current trends relevant to the listed products (e.g., seasonality, consumer preferences, potential for organic demand).
- Identify potential opportunities and risks.

### Price Analysis
- Evaluate the current pricing. Is it competitive?
- Suggest potential pricing strategies (e.g., bundling, discounts for bulk orders).

### Supply and Demand
- Analyze the potential supply and demand for these products.
- Consider factors like recent harvests, import/export trends, and consumer purchasing habits.

### Weather Impact
- Discuss how recent and forecasted weather patterns in major agricultural regions could impact the production and prices of these goods.
- Provide insights on potential risks (e.g., drought, floods) and opportunities.

### Actionable Recommendations
- Provide clear, actionable advice for the farmer.
- Suggest which products to focus on, optimal stock levels, and potential new products to introduce based on the complete analysis.
`,
});

const marketAnalysisFlow = ai.defineFlow(
  {
    name: 'marketAnalysisFlow',
    inputSchema: MarketAnalysisInputSchema,
    outputSchema: MarketAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
