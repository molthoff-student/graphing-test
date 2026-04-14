import { useParams } from "react-router-dom";
import { GraphContextProvider } from "./graph_components/context";
import { GraphRenderer } from "./graph_components/renderer";

export function GraphSlug() {
    const { graphIdentity } = useParams();
    const apiLink = `http://localhost:6767/api-emulator/${graphIdentity}`;
    return <Graph apiLink={apiLink} />
}

type GraphProps = {
    apiLink: string
}

export function Graph(
    {
        apiLink 
    }: GraphProps
) {
    return (
        <>
            <GraphContextProvider>
                <GraphRenderer apiLink={apiLink} />
            </GraphContextProvider>
        </>
    );
}