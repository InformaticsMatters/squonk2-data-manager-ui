import { pagePolicies, withPagePolicy } from "../../../../application/pagePolicy";
import { ProjectFiles } from "../../../../projects/ProjectFiles";

/**
 * The one file a viewer addresses, beneath the project in the URL. The viewer itself is not yet
 * migrated, so what this entry serves today is the section's answer for a file path it could not
 * address: without a page here Next would answer the URL before the route contract was consulted,
 * and a missing or unusable file path would lose the valid project shell it names.
 */
export default withPagePolicy(pagePolicies.projects("files"), ProjectFiles);
