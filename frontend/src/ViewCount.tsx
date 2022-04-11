import { createResource } from "solid-js";
import { useService } from "solid-services";
import { StatService } from "./store/StatService";

export default function ViewCount(props) {
    const statService = useService(StatService);
    const endpoint = import.meta.env.VITE_PROTOCOL + import.meta.env.VITE_BASEURL;

    const viewCount = async () => (await statService().getViewers(props.name));
    const [vc, { refetch }] = createResource<number>(viewCount); 

    function viewers(): string {
        let count = vc();
        return count < 0 ? 'Offline' : count > 1 ? count + ' Viewers' : count + ' Viewer'
    }

    return <h5>{viewers()}</h5> 
}