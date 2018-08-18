<template>
  <div>
    <input type="text" v-model="displayString" :style="widthStyle" @keydown="keydown">
  </div>
</template>

<script lang="ts">

import Vue from "vue";
import { Component, Prop, Watch } from 'vue-property-decorator';

class NumberString {
  value = '';
  maxLength: number;

  constructor(maxLength: number){
    this.maxLength = maxLength || 4;
  }
  push(char: string){
    if(this.value.length < this.maxLength && char.length === 1){
      this.value = [this.value, char].join('');
    }
  }
  pop(){
   if(this.value.length !== 0){
     this.value = this.value.slice(0, -1);
   } 
  }
  getDisplayString(){
    return this.value.padEnd(this.maxLength, ' ').split('').join('|');
  }
  setValue(inputNumber: string){
    if(inputNumber.length>= this.maxLength && !isNaN(parseInt(inputNumber))){
      this.value = inputNumber;
    }
  }
}
@Component({
})
export default class SingleNumberInput extends Vue {
  displayString = '';
  widthStyle = {
    width: '16ch'
  }
  @Prop() private chNumber!: string;
  stringValue! : NumberString;
  @Prop() value!: string;
  mounted() {
    this.stringValue = new NumberString(Number(this.chNumber));
    this.stringValue.setValue(this.value);
    this.displayString = this.stringValue.getDisplayString();
    this.widthStyle.width = Number(this.chNumber) * 4 + 'ch';
  }

  keydown(event: KeyboardEvent){
    let numberValue = '0123456789'.indexOf(event.key);
    if(numberValue !== -1){
      this.stringValue.push(event.key);
      this.displayString = this.stringValue.getDisplayString();
      this.$emit('input', this.stringValue.value);
    }else if(event.key === "Backspace"){
      this.stringValue.pop()
      this.displayString = this.stringValue.getDisplayString();
      this.$emit('input', this.stringValue.value);
    }
    event.cancelBubble = true;
    event.preventDefault();
  }
}
</script>

<style scoped>
  input{
    background: transparent;
    border: black solid 1px;
    text-align: center;
    border-radius: 5px;
    font-size: xx-large;
    letter-spacing: 1ch;
    text-indent: 1ch;
    font-family: monospace;
    color: transparent;
    text-shadow: 0 0 0 #000;
  }
</style>

