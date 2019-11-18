import * as Joi from 'joi';

import { KEYCLOAK_CREDENTIALS_SCHEMA } from '../../../schemas';
import RoleRepresentation from 'keycloak-admin/lib/defs/roleRepresentation';
import { ICompositeRoleMappingRepresentation } from '../../../interfaces';
import { BaseRoleActionProcessor } from '../BaseRoleActionProcessor';

export class RealmRoleCreateActionProcessor extends BaseRoleActionProcessor {
    private static validationSchema = Joi.object({
        credentials: KEYCLOAK_CREDENTIALS_SCHEMA,
        realmName: Joi.string()
            .min(1)
            .required(),
        role: Joi.object()
            .keys({
                name: Joi.string()
                    .required()
                    .min(1),
            })
            .required()
            .options({
                abortEarly: true,
                allowUnknown: true,
            }),
    })
        .required()
        .options({
            abortEarly: true,
            allowUnknown: false,
        });

    /**
     * @inheritdoc
     */
    getValidationSchema(): Joi.SchemaLike | null {
        return RealmRoleCreateActionProcessor.validationSchema;
    }

    /**
     * @inheritdoc
     */
    async process(): Promise<void> {
        const { credentials, role, realmName } = this.options;

        const adminClient = await this.getKeycloakAdminClient(credentials);

        let compositeRoles: ICompositeRoleMappingRepresentation;
        if (role.composites) {
            compositeRoles = await this.findCompositeRoles(adminClient, realmName, role.composites);
        }

        await adminClient.roles.create({
            ...role,
            realm: realmName,
        });

        const parentRole = await adminClient.roles.findOneByName({
            name: role.name,
            realm: realmName,
        });

        if (compositeRoles) {
            const roles: RoleRepresentation[] = [...compositeRoles.realm];
            for (const clientId of Object.keys(compositeRoles.client)) {
                roles.push(...compositeRoles.client[clientId]);
            }

            await this.addCompositeRoles(adminClient, realmName, parentRole, roles);
        }
    }
}
