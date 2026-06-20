// FlashList v2 dropped `estimatedItemSize` — it auto-estimates from early renders.
import { FlashList } from '@shopify/flash-list';
import { Separator, View, YStack } from 'tamagui';
import type { ListRenderItem } from '@shopify/flash-list';

type ListProps<T> = {
  data: readonly T[];
  renderItem: ListRenderItem<T>;
  keyExtractor?: (item: T, index: number) => string;
  ListEmptyComponent?: React.ReactElement | null;
  contentContainerStyle?: object;
};

export function List<T>({
  data,
  renderItem,
  keyExtractor,
  ListEmptyComponent,
  contentContainerStyle,
}: ListProps<T>) {
  if (data.length === 0 && ListEmptyComponent) {
    return <YStack flex={1}>{ListEmptyComponent}</YStack>;
  }
  return (
    <View flex={1}>
      <FlashList
        data={data as T[]}
        renderItem={renderItem}
        keyExtractor={
          keyExtractor ??
          ((item: T, index: number) => (item as { id?: string }).id ?? String(index))
        }
        ItemSeparatorComponent={() => <Separator borderColor="$borderDefault" borderWidth={0.5} />}
        contentContainerStyle={contentContainerStyle}
      />
    </View>
  );
}
