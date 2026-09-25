import "dotenv/config";
import { GoogleGenAI, FunctionCallingConfigMode } from "@google/genai";

console.log("API key loaded:", !!process.env.GEMINI_API_KEY);


const main = async () => {
    const user = '"what is the addition of 12 and 53"'
    //Function Declarations
    const addNumbersDeclaration = {
        name: "addNumbers",
        description: "add the given numbers together",
        parametersJsonSchema: {
            type: 'object',
            properties: {
                a: {
                    type: 'number',
                    description: 'the first number'
                },
                b: {
                    type: 'number',
                    description: 'the second number'
                }
            },
            required: ['a','b']
        },
    };



    //the addNumbers function to be executed
    const addNumbers = (a,b) => {
        return (a + b)
    }

    // CONNECTION TO THE LLM
    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });

    //Response recieved
    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: user,
        config: {
            tools: [
            {
                functionDeclarations: [addNumbersDeclaration]
            }
            ],

            toolConfig: {
                functionCallingConfig: {
                    mode: FunctionCallingConfigMode.ANY,
                    allowedFunctionNames: ['addNumbers']
                }
            }
        },

    })

    // the FunctionCall from the LLM
    const functionCall = response.functionCalls[0]

    // consume the response from LLM by the tools to give result.
    const result = addNumbers(
        functionCall.args.a, 
        functionCall.args.b
    );


    // // curate function response containing name of tool used and the response of tool

    const functionResponse = {
        name: functionCall.name,
        response: {
            result: result
        }
    }
    // console.log(functionCall);

    const modelResponse = response.candidates[0].content



    const finalResponse = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
            {
                role: 'user',
                parts: [{
                    text: 'user'
                }]
            },
            modelResponse,
            {
                role: 'user',
                parts: [
                    {
                        functionResponse: functionResponse
                    }
                ]
            }
        ],
    })

    console.log(finalResponse.text);
};
main()