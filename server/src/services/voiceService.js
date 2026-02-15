import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const generateSpeech = async (text) => {
    try {
        if (!process.env.ELEVENLABS_API_KEY) {
            console.warn("Missing ELEVENLABS_API_KEY in .env");
            return null;
        }

        const cleanText = text.replace(/[*#]/g, '').trim();
        const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Friendly "Rachel" voice

        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                text: cleanText,
                model_id: "eleven_turbo_v2_5", 
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            },
            {
                headers: {
                    'Accept': 'audio/mpeg',
                    'xi-api-key': process.env.ELEVENLABS_API_KEY, 
                    'Content-Type': 'application/json'
                },
                responseType: 'arraybuffer' 
            }
        );

        return Buffer.from(response.data, 'binary').toString('base64');

    } catch (error) {
        const errorMessage = error.response?.data 
            ? error.response.data.toString('utf8') 
            : error.message;
            
        console.error("TTS Generation Error:", errorMessage);
        return null; 
    }
};