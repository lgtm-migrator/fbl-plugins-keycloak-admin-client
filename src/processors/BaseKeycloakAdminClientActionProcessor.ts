import { ActionProcessor, ActionError } from 'fbl';
import KeycloakAdminClient from 'keycloak-admin';
import { ICredentials } from '../interfaces';

export abstract class BaseKeycloakAdminClientActionProcessor extends ActionProcessor {
    /**
     * Create new instance of `keycloak-admin` client and authenticate with provided credentials
     * // TODO: assign client to class variable
     */
    async getKeycloakAdminClient(credentials: ICredentials): Promise<KeycloakAdminClient> {
        const client = new KeycloakAdminClient(credentials);
        await client.auth(credentials);

        return client;
    }

    async wrapKeycloakAdminRequest(request: Function): Promise<any> {
        try {
            return await request();
        } catch (e) {
            /* istanbul ignore else */
            if (e.response && e.response.data && e.response.data.errorMessage) {
                throw new ActionError(`${e.message}: ${e.response.data.errorMessage}`, e.response.status.toString());
            }

            throw e;
        }
    }
}
