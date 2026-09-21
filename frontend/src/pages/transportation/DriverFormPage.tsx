import CodedMasterFormPage from '../../components/common/CodedMasterFormPage';
import { driverApi } from '../../services/transportMasterService';

const DriverFormPage = () => (
  <CodedMasterFormPage
    title="Driver"
    codeField="driverCode"
    codeLabel="Driver Code"
    listPath="/drivers"
    api={driverApi}
  />
);

export default DriverFormPage;
