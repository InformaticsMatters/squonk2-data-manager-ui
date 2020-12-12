import { Tooltip } from '@material-ui/core';

interface IProps {
  condition: boolean;
  title: string;
  children: React.ReactElement;
}

/**
 * Add a Tooltip component around the child only if the condition is met.
 * This component exists because the Mui Tooltip can't exist on a `disabled` component.
 */
const ConditionalTooltip: React.FC<IProps> = ({ condition, title, children }) => {
  if (condition) {
    return (
      <Tooltip arrow title={title}>
        {children}
      </Tooltip>
    );
  } else {
    return children;
  }
};

export default ConditionalTooltip;
