import React from 'react';
import { View, StyleSheet } from 'react-native';

const IndividualPostCell = () => {
  const createUIView = (height, backgroundColor, key) => (
    <View 
      key={key}
      style={[
        styles.baseView,
        { 
          height: height,
          backgroundColor: backgroundColor 
        }
      ]} 
    />
  );

  return (
    <View style={styles.container}>
      {createUIView(220, '#FF6B6B', 'itemInfoView')}
      {createUIView(60, '#4ECDC4', 'itemPurchasedView')}
      {createUIView(40, '#45B7D1', 'itemStoresView')}
      {createUIView(60, '#96CEB4', 'itemCaptionView')}
      {createUIView(2, '#FFEAA7', 'itemDividerView')}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  baseView: {
    width: '100%',
    marginBottom: 5,
    borderRadius: 8,
  },
});

export default IndividualPostCell;



