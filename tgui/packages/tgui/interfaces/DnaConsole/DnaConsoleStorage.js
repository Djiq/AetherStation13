import { uniqBy } from 'common/collections';
import { capitalize } from 'common/string';

import { useBackend } from '../../backend';
import { Box, Button, Collapsible, Divider, Flex, LabeledList, Section } from '../../components';
import {
  STORAGE_CONS_SUBMODE_CHROMOSOMES,
  STORAGE_CONS_SUBMODE_MUTATIONS,
  STORAGE_DISK_SUBMODE_ENZYMES,
  STORAGE_DISK_SUBMODE_MUTATIONS,
  STORAGE_MODE_ADVINJ,
  STORAGE_MODE_CONSOLE,
  STORAGE_MODE_DISK,
} from './constants';
import { GeneticMakeupInfo } from './GeneticMakeupInfo';
import { MutationInfo } from './MutationInfo';


const DnaConsoleAdvancedInjectors = (props) => {
  const { act, data } = useBackend();
  const {
    maxAdvInjectors,
    isInjectorReady,
  } = data;
  const advInjectors = data.storage.injector ?? [];
  return (
    <Section title="Advanced Injectors">
      {advInjectors.map(injector => (
        <Collapsible
          key={injector.name}
          title={injector.name}
          buttons={(
            <>
              <Button
                icon="syringe"
                disabled={!isInjectorReady}
                content="Print"
                onClick={() => act('print_adv_inj', {
                  name: injector.name,
                })} />
              <Button
                ml={1}
                color="red"
                icon="times"
                onClick={() => act('del_adv_inj', {
                  name: injector.name,
                })} />
            </>
          )}>
          <StorageMutations
            mutations={injector.mutations}
            customMode={`advinj${advInjectors.findIndex(
              e => injector.name === e.name)}`} />
        </Collapsible>
      ))}
      <Box mt={2}>
        <Button.Input
          minWidth="200px"
          content="Create new injector"
          disabled={advInjectors.length >= maxAdvInjectors}
          onCommit={(e, value) => act('new_adv_inj', {
            name: value,
          })} />
      </Box>
    </Section>
  );
};

const StorageButtons = (props) => {
  const { data, act } = useBackend();
  const { hasDisk } = data;
  const { storageMode, storageConsSubMode, storageDiskSubMode } = data.view;
  return (
    <>
      {storageMode === STORAGE_MODE_CONSOLE && (
        <>
          <Button
            selected={storageConsSubMode === STORAGE_CONS_SUBMODE_MUTATIONS}
            content="Mutations"
            onClick={() => act('set_view', {
              storageConsSubMode: STORAGE_CONS_SUBMODE_MUTATIONS,
            })} />
          <Button
            selected={storageConsSubMode === STORAGE_CONS_SUBMODE_CHROMOSOMES}
            content="Chromosomes"
            onClick={() => act('set_view', {
              storageConsSubMode: STORAGE_CONS_SUBMODE_CHROMOSOMES,
            })} />
        </>
      )}
      {storageMode === STORAGE_MODE_DISK && (
        <>
          <Button
            selected={storageDiskSubMode === STORAGE_CONS_SUBMODE_MUTATIONS}
            content="Mutations"
            onClick={() => act('set_view', {
              storageDiskSubMode: STORAGE_CONS_SUBMODE_MUTATIONS,
            })} />
          <Button
            selected={storageDiskSubMode === STORAGE_DISK_SUBMODE_ENZYMES}
            content="Enzymes"
            onClick={() => act('set_view', {
              storageDiskSubMode: STORAGE_DISK_SUBMODE_ENZYMES,
            })} />
        </>
      )}
      <Box inline mr={1} />
      <Button
        content="Console"
        selected={storageMode === STORAGE_MODE_CONSOLE}
        onClick={() => act('set_view', {
          storageMode: STORAGE_MODE_CONSOLE,
          storageConsSubMode: STORAGE_CONS_SUBMODE_MUTATIONS
            ?? storageConsSubMode,
        })} />
      <Button
        content="Disk"
        disabled={!hasDisk}
        selected={storageMode === STORAGE_MODE_DISK}
        onClick={() => act('set_view', {
          storageMode: STORAGE_MODE_DISK,
          storageDiskSubMode: STORAGE_DISK_SUBMODE_MUTATIONS
            ?? storageDiskSubMode,
        })} />
      <Button
        content="Adv. Injector"
        selected={storageMode === STORAGE_MODE_ADVINJ}
        onClick={() => act('set_view', {
          storageMode: STORAGE_MODE_ADVINJ,
        })} />
    </>
  );
};

const StorageChromosomes = (props) => {
  const { data, act } = useBackend();
  const chromos = data.chromoStorage ?? [];
  const uniqueChromos = uniqBy(chromo => chromo.Name)(chromos);
  const chromoName = data.view.storageChromoName;
  const chromo = chromos.find(chromo => chromo.Name === chromoName);
  return (
    <Flex>
      <Flex.Item width="140px">
        <Section
          title="Console Storage"
          level={2}>
          {uniqueChromos.map(chromo => (
            <Button
              key={chromo.Index}
              fluid
              ellipsis
              color="transparent"
              selected={chromo.Name === chromoName}
              content={chromo.Name}
              onClick={() => act('set_view', {
                storageChromoName: chromo.Name,
              })} />
          ))}
        </Section>
      </Flex.Item>
      <Flex.Item>
        <Divider vertical />
      </Flex.Item>
      <Flex.Item grow={1} basis={0}>
        <Section
          title="Chromosome Info"
          level={2}>
          {!chromo && (
            <Box color="label">
              Nothing to show.
            </Box>
          ) || (
            <>
              <LabeledList>
                <LabeledList.Item label="Name">
                  {chromo.Name}
                </LabeledList.Item>
                <LabeledList.Item label="Description">
                  {chromo.Description}
                </LabeledList.Item>
                <LabeledList.Item label="Amount">
                  {chromos
                    .filter(x => x.Name === chromo.Name)
                    .length}
                </LabeledList.Item>
              </LabeledList>
              <Button
                mt={2}
                icon="eject"
                content={"Eject Chromosome"}
                onClick={() => act('eject_chromo', {
                  chromo: chromo.Name,
                })} />
            </>
          )}
        </Section>
      </Flex.Item>
    </Flex>
  );
};

const StorageMutations = (props) => {
  const {
    customMode = '',
  } = props;
  const { data, act } = useBackend();
  const mutations = props.mutations || [];
  const mode = data.view.storageMode + customMode;

  let mutationRef = data.view[`storage${mode}MutationRef`];
  let mutation = mutations
    .find(mutation => mutation.ByondRef === mutationRef);

  // If no mutation is selected but there are stored mutations, pick the first
  // mutation and set that as the currently showed one.
  if (!mutation && mutations.length > 0) {
    mutation = mutations[0];
    mutationRef = mutation.ByondRef;
  }

  return (
    <Flex>
      <Flex.Item width="140px">
        <Section
          title={`${capitalize(data.view.storageMode)} Storage`}
          level={2}>
          {mutations.map(mutation => (
            <Button
              key={mutation.ByondRef}
              fluid
              ellipsis
              color="transparent"
              selected={mutation.ByondRef === mutationRef}
              content={mutation.Name}
              onClick={() => act('set_view', {
                [`storage${mode}MutationRef`]: mutation.ByondRef,
              })} />
          ))}
        </Section>
      </Flex.Item>
      <Flex.Item>
        <Divider vertical />
      </Flex.Item>
      <Flex.Item grow={1} basis={0}>
        <Section
          title="Mutation Info"
          level={2}>
          <MutationInfo
            mutation={mutation} />
        </Section>
      </Flex.Item>
    </Flex>
  );
};

export const DnaConsoleStorage = (props) => {
  const { data, act } = useBackend();
  const { storageMode, storageConsSubMode, storageDiskSubMode } = data.view;
  const { diskMakeupBuffer, diskHasMakeup } = data;
  const mutations = data.storage[storageMode];
  return (
    <Section
      title="Storage"
      buttons={(
        <StorageButtons />
      )}>
      {storageMode === STORAGE_MODE_CONSOLE
        && storageConsSubMode === STORAGE_CONS_SUBMODE_MUTATIONS && (
        <StorageMutations mutations={mutations} />
      )}
      {storageMode === STORAGE_MODE_CONSOLE
        && storageConsSubMode === STORAGE_CONS_SUBMODE_CHROMOSOMES && (
        <StorageChromosomes />
      )}
      {storageMode === STORAGE_MODE_DISK
        && storageDiskSubMode === STORAGE_DISK_SUBMODE_MUTATIONS && (
        <StorageMutations mutations={mutations} />
      )}
      {storageMode === STORAGE_MODE_DISK
        && storageDiskSubMode === STORAGE_DISK_SUBMODE_ENZYMES && (
        <>
          <GeneticMakeupInfo makeup={diskMakeupBuffer} />
          <Button
            icon="times"
            color="red"
            disabled={!diskHasMakeup}
            content={'Delete'}
            onClick={() => act('del_makeup_disk')} />
        </>
      )}
      {storageMode === STORAGE_MODE_ADVINJ && (
        <DnaConsoleAdvancedInjectors />
      )}
    </Section>
  );
};
