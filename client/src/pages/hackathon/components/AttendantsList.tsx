import { Avatar, Badge, Box, Heading, Stack, Tag, Text } from '@chakra-ui/core';
import _ from 'lodash';
import React from 'react';
import { StyledLinkRouter, StyledResponsiveFlex, StyledUserBox } from '../../../components/Common';
import UserBadge from '../../../components/UserBadge';
import { Attendant } from '../../../models/Models';
import { inviteAttendantToGroup } from '../../../services/AttendantService';
import { getRandomColorString, getRandomVariantColorString } from '../../../utils/colors';
import { StyledBlueButton, StyledBottomBoxContainer } from './StyledComponents';

type AttendantsProps = {
    attendants: Attendant[];
    currentAttendant?: Attendant;
};

export const AttendantsList: React.FC<AttendantsProps> = ({ attendants, currentAttendant }) => {
    const [orderedAttendants, setOrderedAttendants] = React.useState<Attendant[]>();
    const [invitedAttendants, setInvitedAttendants] = React.useState<Set<string>>(new Set());

    React.useEffect(() => {
        setOrderedAttendants(_.orderBy(attendants, ['group'], ['asc']));
    }, [attendants]);

    const onInviteAttendant = (toId: string) => {
        if (currentAttendant?._id != null) {
            inviteAttendantToGroup(currentAttendant?._id, toId).then((result) => {
                setInvitedAttendants((curr) => new Set([...curr, toId]));
            });
        }
    };

    const colors: string[] = React.useMemo(() => {
        if (orderedAttendants == null) return [];

        const grouped = _.groupBy(orderedAttendants, (a) => a.group);
        const colorsMap = new Map();
        Object.keys(grouped).forEach((key) => colorsMap.set(key, getRandomColorString()));
        return orderedAttendants.map((a) =>
            a.group != null ? colorsMap.get(a.group.toString()) : getRandomColorString()
        );
    }, [orderedAttendants]);

    return (
        <StyledBottomBoxContainer>
            {attendants.length === 0 ? (
                <Text fontSize='lg'>Ancora nessun iscritto</Text>
            ) : (
                <Box>
                    {orderedAttendants?.map((attendant, index) => (
                        <StyledUserBox borderColor={colors[index]} key={index}>
                            <StyledResponsiveFlex>
                                <Box>
                                    <Stack isInline alignItems='center'>
                                        <Avatar
                                            name={attendant.user.username}
                                            src={
                                                attendant.user?.avatar
                                                    ? `avatar/${attendant.user.avatar}`
                                                    : undefined
                                            }
                                            pr='3px'
                                        />
                                        <StyledLinkRouter
                                            to={`/profile/${attendant.user.username}`}>
                                            <Heading as='h3' size='md'>
                                                {attendant.user.username}
                                            </Heading>
                                        </StyledLinkRouter>
                                    </Stack>
                                    <UserBadge user={attendant.user} />
                                </Box>
                                <Stack
                                    textAlign={['center', 'center', 'left']}
                                    alignItems='center'
                                    spacing='2px'>
                                    {attendant.group != null ? (
                                        <Text>Gruppo #{attendant.group}</Text>
                                    ) : (
                                        <Text>Utente senza gruppo</Text>
                                    )}
                                    {currentAttendant &&
                                        getGroupButton(
                                            currentAttendant,
                                            attendant,
                                            invitedAttendants,
                                            onInviteAttendant
                                        )}
                                </Stack>
                            </StyledResponsiveFlex>

                            <Box>
                                {_.take(
                                    attendant.user.skills?.filter((skill) => skill.length < 30),
                                    5
                                ).map((skill, index) => (
                                    <Tag
                                        size='lg'
                                        m='2px'
                                        variantColor={getRandomVariantColorString()}
                                        key={index}>
                                        {skill}
                                    </Tag>
                                ))}
                            </Box>
                        </StyledUserBox>
                    ))}
                </Box>
            )}
        </StyledBottomBoxContainer>
    );
};

function getGroupButton(
    currentAttendant: Attendant,
    attendantInList: Attendant,
    invitedAttendants: Set<string>,
    onInvite: (toId: string) => void
) {
    if (attendantInList.user._id === currentAttendant.user._id) {
        return null;
    }

    let text = '';
    const invite = attendantInList.invites?.find(
        (invite) => (invite.from as any) === currentAttendant._id
    );
    const alreadyInvited = invite != null || invitedAttendants.has(attendantInList._id);

    if (
        (alreadyInvited && invite?.status === 'pending') ||
        (alreadyInvited && invite?.status == null)
    ) {
        return (
            <Badge ml='1' fontSize='0.8em' variantColor='green' rounded='md'>
                <Text fontSize='md' fontWeight='bold'>
                    INVITATO
                </Text>
            </Badge>
        );
    } else if (alreadyInvited && invite?.status === 'declined') {
        return (
            <Badge ml='1' fontSize='0.8em' variantColor='red' rounded='md'>
                <Text fontSize='sm' fontWeight='bold'>
                    NON ACCETTATO
                </Text>
            </Badge>
        );
    } else if (currentAttendant.group == null && attendantInList.group == null) {
        text = 'Crea gruppo';
    } else if (currentAttendant.group != null && attendantInList.group == null) {
        text = 'Invita nel tuo gruppo';
    }

    if (text)
        return (
            <StyledBlueButton size='sm' onClick={() => onInvite(attendantInList._id)}>
                {text}
            </StyledBlueButton>
        );
    return;
}
