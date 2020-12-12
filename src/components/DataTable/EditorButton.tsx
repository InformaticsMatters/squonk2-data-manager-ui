import { IconButton } from '@material-ui/core';

import { useUserProfile } from '../../hooks/useUserProfile';
import ConditionalTooltip from '../ConditionalTooltip';

interface IProps {
  editors: string[];
  IconElement: JSX.Element;
  onClick: () => void;
  title: string;
}

const EditorButton: React.FC<IProps> = ({ editors, IconElement, onClick, title }) => {
  const { profile } = useUserProfile();
  const isDisabled = profile === null || !profile.username || !editors.includes(profile.username);

  return (
    <ConditionalTooltip condition={!isDisabled} title={title}>
      <IconButton disabled={isDisabled} onClick={onClick}>
        {IconElement}
      </IconButton>
    </ConditionalTooltip>
  );
};

export default EditorButton;
