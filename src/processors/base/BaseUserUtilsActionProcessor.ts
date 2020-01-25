import KeycloakAdminClient from 'keycloak-admin';
import UserRepresentation from 'keycloak-admin/lib/defs/userRepresentation';
import { ICompositeRoleRepresentation } from '../../interfaces';
import RoleRepresentation from 'keycloak-admin/lib/defs/roleRepresentation';
import { BaseGroupUtilsActionProcessor } from './BaseGroupUtilActionProcessor';

export abstract class BaseUserUtilsActionProcessor extends BaseGroupUtilsActionProcessor {
    /**
     * Find user role mappings
     * @param adminClient
     * @param user
     * @param realmName
     */
    async findUserRoleMappings(
        adminClient: KeycloakAdminClient,
        user: UserRepresentation,
        realmName: string,
    ): Promise<ICompositeRoleRepresentation> {
        this.snapshot.log(`[realm=${realmName}] [username=${user.username}] Looking for user role mappings.`);
        const mappings = await adminClient.users.listRoleMappings({
            id: user.id,
            realm: realmName,
        });
        this.snapshot.log(`[realm=${realmName}] [username=${user.username}] User role mappings successfully loaded.`);

        const result: ICompositeRoleRepresentation = {
            realm: [],
            client: {},
        };

        if (mappings.realmMappings) {
            result.realm = mappings.realmMappings.map(r => r.name);
        }

        /* istanbul ignore else */
        if (mappings.clientMappings) {
            for (const clientId of Object.keys(mappings.clientMappings)) {
                result.client[clientId] = mappings.clientMappings[clientId].mappings.map(
                    (r: RoleRepresentation) => r.name,
                );
            }
        }

        return result;
    }
}
