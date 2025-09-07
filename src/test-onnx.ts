import * as ort from 'onnxruntime-node';
import * as fs from 'fs';
import * as path from 'path';

async function testOnnxRuntime() {
    try {
        console.log('Testing ONNX Runtime...');
        console.log('ONNX Runtime loaded successfully');
        
        // Check if the ONNX model file exists
        const modelPath = path.join(__dirname, '..', 'AImix_model.onnx');
        if (fs.existsSync(modelPath)) {
            console.log('Found ONNX model at:', modelPath);
            
            // Try to create a session with the model
            const session = await ort.InferenceSession.create(modelPath);
            console.log('Successfully created inference session');
            console.log('Model input names:', session.inputNames);
            console.log('Model output names:', session.outputNames);
            
            // Get input metadata
            session.inputNames.forEach(name => {
                const input = session.inputMetadata[name];
                console.log(`Input "${name}":`, {
                    type: input.type,
                    dims: input.dims
                });
            });
            
            // Get output metadata
            session.outputNames.forEach(name => {
                const output = session.outputMetadata[name];
                console.log(`Output "${name}":`, {
                    type: output.type,
                    dims: output.dims
                });
            });
            
        } else {
            console.log('ONNX model not found at:', modelPath);
        }
        
        console.log('ONNX Runtime test completed successfully!');
        
    } catch (error) {
        console.error('Error testing ONNX Runtime:', error);
    }
}

testOnnxRuntime();
