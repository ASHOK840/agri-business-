import CodedMasterFormPage from '../../components/common/CodedMasterFormPage';
import { transporterApi } from '../../services/transportMasterService';

const TransporterFormPage = () => (
  <CodedMasterFormPage
    title="Transporter"
    codeField="transporterCode"
    codeLabel="Transporter Code"
    listPath="/transporters"
    api={transporterApi}
  />
);

export default TransporterFormPage;
