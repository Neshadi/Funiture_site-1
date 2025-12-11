import ARViewer from "../../pages/ARViewer/ARViewer";
import IosARView from "../../pages/IosARView/IosARView";

const ARViewFilter = () => {
    const deviceType = useDeviceType();
    if (deviceType === 'ios'){
        return <IosARView/>
    }
    else {
        return <ARViewer/>
            
            
    }
};

export default ARViewFilter ;