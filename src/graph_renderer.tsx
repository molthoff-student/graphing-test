import { useParams } from "react-router-dom";


export function GraphRenderer() {
    const { graphIdentity } = useParams();
    console.log(`graph identity: '${graphIdentity}'`);
    return (
        <h1>{graphIdentity}</h1>
    );
}