/** 
* TO DO アプリ
*/
import { generateCalendar } from './calender.js';

const TO_DO_APP = () => {
   const stage = document.getElementById('stage');
   const CLASS_NONE = 'js-none';
   const now = new Date();
   const lStorage = localStorage;
   const taskForm = document.getElementById('js-taskForm');
   const date = new Date();  // date を定義
   const currentYear = date.getFullYear();
   const currentMonth = date.getMonth(); 
   
   /**
    * 汎用的に使える関数群
    */
   const utilFunc = {
       /**
        * 中身を空にする
        * @param {Node} target 中身を空にするオブジェクト
        */
       emptyHtml(target) {
           while (target.firstChild) {
               target.removeChild(target.firstChild);
           }
       },

       /**
        * ゼロパディング
        * @param {Number} Num ゼロパティングする値
        * @param {Number} digit 最終的な桁数
        * @return {String} 数値文字列
        */
       addZeroPadding(Num, digit) {
           let result = '';
           for (let i = 1; i < digit; i += 1) {
               result += '0';
           }
           return (result + Num).slice(-digit);
       },

       /**
        * 文字列エスケープ
        * @param {String} str
        */
       escapeHtml(str) {
           if (typeof str !== 'string') {
               return str;
           }
           return str.replace(/[&'`"<>]/g, (match) => ({
               '&': '&amp;',
               "'": '&#x27;',
               '`': '&#x60;',
               '"': '&quot;',
               '<': '&lt;',
               '>': '&gt;'
           }[match]));
       },

       /**
        * 空白（空文字）であるかチェック
        * @param {String} str
        */
       isBlank(str) {
           if (/\S/.test(str)) {
               return false;
           }
           return true;
       },

       /**
        * チェックが入ったラジオボタンのvalue値を返す
        * @param {NodeList} elements ラジオボタン要素群
        */
       getCheckedRadioValue(elements) {
           let result;
           Array.prototype.slice.call(elements).some((item) => {
               if (item.checked) {
                   result = item.value;
                   return true;
               }
               return false;
           });
           return result;
       }
   };

   const formattedToday = `${now.getFullYear()}-${utilFunc.addZeroPadding(now.getMonth() + 1, 2)}-${utilFunc.addZeroPadding(now.getDate(), 2)}`;

   /**
    * ユーザーエージェント判別用モジュール
    */
   const checkUserAgent = (() => {
       const _ua = navigator.userAgent.toLowerCase();
       const isIE = (_ua.includes('msie') && !_ua.includes('opera')) || _ua.includes('trident');
       const isEdge = _ua.includes('edge');
       const isChrome = _ua.includes('chrome') && !_ua.includes('edge');
       const isFirefox = _ua.includes('firefox');
       const isSafari = _ua.includes('safari') && !_ua.includes('chrome');
       const isOpera = _ua.includes('opera');

       const getUa = () => _ua;
       /**
        * デバイスの種類を判定
        * @returns {String} デバイスを表す文字列
        */
       const getDevice = () => {
           if (_ua.includes('iphone') || _ua.includes('ipod') || (_ua.includes('android') && _ua.includes('mobile'))) {
               return 'sp';
           } else if (_ua.includes('ipad') || _ua.includes('android')) {
               return 'tablet';
           }
           return 'pc';
       };

       /**
        * ブラウザ判定の結果により注意文言を取得
        * @return {Boolean | String}
        */
       const getAlertMessage = () => {
           const device = getDevice();
           if (device !== 'pc') {
               return false;
           }
           if (!isEdge && !isChrome) {
               return '<div class="alert alert-danger" role="alert">お使いのブラウザでは正しく動作しない可能性があります。<br>ChromeもしくはEdgeでご覧ください。</div>';
           }
           return false;
       };

       return {
           getUa,
           isIE,
           isEdge,
           isChrome,
           isFirefox,
           isSafari,
           isOpera,
           getDevice,
           getAlertMessage
       };
   })();

   if (checkUserAgent.isIE) {
       stage.innerHTML = '<div class="alert alert-danger" role="alert">お使いのブラウザでは動作しません。<br>ChromeもしくはEdgeでご覧ください。</div>';
   }

   // Model管理
   const model = {
       dispatcher: document.createElement('div'),
       ev: new Event('dataChange'),

       // ステート（直接外部からは参照できない）
       _stateAll: [],

       /**
        * ステートへの保存
        * @param {String} type
        * @param {*} arg
        */
       setItem(type, arg) {
           switch (type) {
           case 'add':
               this._stateAll.push(arg);
               break;
           case 'changeStatus':
               this._stateAll[arg[0]].status = arg[1] ? 'complete' : 'open';
               break;
           case 'edit': {
               const targetElement = this._stateAll[arg[0]];
               targetElement.content = arg[1];
               targetElement.priority = parseInt(arg[2], 10);
               targetElement.limit = arg[3];
               break;
           }
           case 'all':
               this._stateAll = arg;
               break;
           default:
               throw Error('The value of the argument is invalid');
           }
           this.dispatcher.dispatchEvent(this.ev);
       },

       /**
        * ステートの取得
        */
       getItem(opt_index) {
           if (opt_index >= 0 && opt_index < this._stateAll.length) {
               return this._stateAll[opt_index];
           }
           return this._stateAll;
       },

       /**
        * ソート
        */
       sortItem(ary, order) {
           this._stateAll.sort((a, b) => {
               if (!Array.isArray(ary)) {
                   return 0;
               }
               let valueA = null;
               let valueB = null;

               for (let i = 0, l = ary.length; i < l; i += 1) {
                   if (!Object.prototype.hasOwnProperty.call(a, ary[i]) ||
                       !Object.prototype.hasOwnProperty.call(b, ary[i])) {
                       return 0;
                   }
                   valueA = (typeof a[ary[i]] === 'string') ? a[ary[i]].toUpperCase() : a[ary[i]];
                   valueB = (typeof b[ary[i]] === 'string') ? b[ary[i]].toUpperCase() : b[ary[i]];

                   // 期限が空の場合は今日の日付を一時的に設定
                   if (ary[i] === 'limit') {
                       valueA = !valueA ? `${formattedToday}-1` : valueA;
                       valueB = !valueB ? `${formattedToday}-1` : valueB;
                   }

                   if (valueA < valueB) {
                       if (!Array.isArray(order) || order[i] === 'asc') {
                           return -1;
                       }
                       return 1;
                   } else if (valueA > valueB) {
                       if (!Array.isArray(order) || order[i] === 'asc') {
                           return 1;
                       }
                       return -1;
                   }
               }
               return 0;
           });
           this.dispatcher.dispatchEvent(this.ev);
       },

       /**
        * 完了済みの要素を削除
        */
       removeCompletedItem() {
           this._stateAll = this._stateAll.filter((value) => {
               if (value.status !== 'complete') {
                   return value;
               }
               return false;
           });
           this.dispatcher.dispatchEvent(this.ev);
       },

       /**
        * 全削除
        */
       deleteAllItem() {
           this._stateAll.length = 0;
           this.dispatcher.dispatchEvent(this.ev);
       }
   };


   /**
    * フォームのinput[type="date"]のvalue属性に今日の日付を設定
    */
   const setInputDateValue = (() => {
       const dateInput = taskForm.querySelector('input[type="date"]');
       const setInput = () => {
           dateInput.value = formattedToday;
       };
       if (!dateInput) {
           return false;
       }
       return setInput;
   })();

   const events = [];
 
   
   /**
    * イベント情報をカレンダーに追加
    * @param {Object} calendarEl カレンダーの要素
    * @param {Number} currentYear カレンダーの表示年
    * @param {Number} currentMonth カレンダーの表示月
    */
   function appendEventsToCalendar(calendarEl, currentYear, currentMonth) {
       events.forEach(event => {
           if (event.date.getFullYear() === currentYear && event.date.getMonth() === currentMonth) {
               const dayCell = calendarEl.querySelector(`td[data-date="${event.date.getDate()}"]`);
               // しるしのクラスを重要度に応じて設定
               const importanceClass = getImportanceClass(event.importance);
               dayCell.innerHTML += `<div class="${importanceClass}"></div>`;
           }
       
       });
   }

   
   /**
    * タスクを追加した際の処理
    * @param {Object} task 追加されたタスクの情報
    */
   function handleTaskAdd(task) {
       // 重要度ごとのしるしをカレンダーに追加
       events.push({ date: new Date(task.limit), importance: task.priority });
       // カレンダーを更新
       const date = new Date();
       const currentYear = date.getFullYear();
       const currentMonth = date.getMonth();
       const calendarEl = document.getElementById('calendar');
        // カレンダーにイベント情報を追加
   appendEventsToCalendar(currentYear, currentMonth);
   }

   /**
    * フォームのイベント登録
    */
   const setFormEvent = () => {
       const clearForm = () => {
           taskForm.reset();
           setInputDateValue();
       };

       const setClear = () => {
           const btnClear = taskForm.querySelector('input[type="reset"]');
           if (!btnClear) {
               return;
           }
           btnClear.addEventListener('click', (e) => {
               e.preventDefault();
               clearForm();
           });
       };

       const setAdd = () => {
           taskForm.addEventListener('submit', (e) => {
               e.preventDefault();
               const task = {
                   content: taskForm.content.value,
                   priority: utilFunc.getCheckedRadioValue(taskForm.priority),
                   limit: taskForm.limit.value,
                   status: 'open'
               };
               if (utilFunc.isBlank(task.content)) {
                   alert('内容を入力してください');
                   taskForm.reset();
                   return;
               }
               task.content = task.content.trim();
               model.setItem('add', task);
               clearForm();
               handleTaskAdd(task); // Call the new function here
           });
       };

       setClear();
       setAdd();
   };

   /**
    * 全データから各値をまとめたオブジェクト
    */
   const statusData = {
       init() {
           // 全データ
           const dataAll = model.getItem();
           // タスク総数
           this.totalCount = dataAll.length;
           // 残タスク数
           this.leftCount = (() => {
               let result = 0;
               dataAll.forEach((value) => {
                   if (value.status === 'open') {
                       result += 1;
                   }
               });
               return result;
           })();
           // 完了済みタスク数
           this.completeCount = this.totalCount - this.leftCount;
           // タスク完遂率
           this.completionRate = (() => {
               let result = null;
               result = Math.floor((this.completeCount / this.totalCount) * 100);
               if (Number.isNaN(result)) {
                   return 0;
               }
               return result;
           })();
       }
   };

   /**
    * ハイフンつなぎの日付から正確な日時を示すDateオブジェクト取得
    * @param {String} dateText 
    * @return {Object} 
    */
   const getCorrectDateObj = (dateText) => {
       if (!dateText) {
           return null;
       }
       return new Date(dateText.replace(/-/g, '/'));
   };

   /**
    * 期限に対しての状態を取得
    * @param {String} dateText 2017-09-25 のようなハイフンつなぎの文字列
    * @param {Date} endDateObj 期限の日付オブジェクト
    * @param {Date} nowDateObj 現在の日付けオブジェクト
    * @return {String}
    */
   const getStatusAgainstlimit = (dateText, endDateObj, nowDateObj) => {
       if (!dateText || !endDateObj) {
           return null;
       }
       const endTime = (() =>
           new Date(
               endDateObj.getFullYear(),
               endDateObj.getMonth(),
               endDateObj.getDate() + 1,
               endDateObj.getHours(),
               endDateObj.getMinutes(),
               endDateObj.getSeconds() - 1
           ))();
       if (endTime.getTime() - nowDateObj.getTime() <= 0) {
           return 'over';
       } else if (endTime.getTime() - nowDateObj.getTime() < 86400000) {
           return 'thatday';
       }
       return 'notyet';
   };

   /**
    * 期限に対して現在の状態を表すhtmlを取得
    * @param {String} status 期限に対しての現在の状態
    * @param {Date} endDateObj 期限の日付オブジェクト
    * @param {Date} nowDateObj 現在の日付けオブジェクト
    * @return {String}
    */
   const getShowHtmlAgainstlimit = (status, endDateObj, nowDateObj) => {
       switch (status) {
       case 'over': {
           return '期限が過ぎています!!';
       }
       case 'thatday': {
           return '今日が期限です!';
       }
       case 'notyet': {
           if (!endDateObj || !nowDateObj) {
               return null;
           }
           const diffTime = endDateObj.getTime() - nowDateObj.getTime();
           const diffDate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
           return `残り${diffDate}日`;
       }
       default:
           return null;
       }
   };

   /**
    * 優先度を示す文字列を表示用に変換
    * @param {Number} priority 優先度を示す数値
    */
   const getPriorityStr = (priority) => {
       let str = '';
       switch (priority) {
       case 3:
           str = '高';
           break;
       case 1:
           str = '低';
           break;
       default:
           str = '中';
           break;
       }
       return str;
   };

/**
* タスクの描画
*/
const renderTask = () => {
   // 全データ
   const dataAll = model.getItem();
   if (dataAll.length <= 0) {
       stage.innerHTML = '<div class="alert alert-info" role="alert">下記フォームからタスクを入力してください</div>';
       return;
   }
   const ul = document.createElement('ul');
   ul.className = 'mb-4 p-0';
   let html = '';

   dataAll.forEach((dataItem) => {
       const itemlimit = dataItem.limit;
       const endDay = getCorrectDateObj(itemlimit);
       const statusAgainstlimit = getStatusAgainstlimit(itemlimit, endDay, now);
       const htmlAgainstlimit = getShowHtmlAgainstlimit(statusAgainstlimit, endDay, now);
       const txt = dataItem.content;

       html += `
           <li class="card mb-2 taskItem is-${dataItem.priority}${dataItem.status === 'complete' ? ' is-complete' : ''}${statusAgainstlimit === 'over' ? ' is-over' : ''}">
               <div class="py-1 px-3">
                   <p class="font-weight-bold my-0 taskContent">${utilFunc.escapeHtml(txt)}</p>
                   <div class="calendarMark"></div>
               </div>
               <div class="taskStatus px-3 small">
                   <div class="row justify-content-between align-items-center py-1 px-3">
                       <div class="">
                           <dl class="d-inline-block mb-0 mr-3">
                               <dt class="d-inline-block">優先度</dt>
                               <dd class="d-inline-block">${getPriorityStr(+dataItem.priority)}</dd>
                           </dl>
                           ${dataItem.limit ? `
                           <dl class="d-inline-block mb-0">
                               <dt class="d-inline-block">期限</dt>
                               <dd class="d-inline-block">${dataItem.limit}<span class="ml-1">【${htmlAgainstlimit}】</span></dd>
                           </dl>
                           ` : ''}
                       </div>
                       <div class="">
                           <ul class="list-inline">
                               <li class="list-inline-item">
                                   <label class="custom-control custom-checkbox">
                                       <input type="checkbox" class="custom-control-input js-completeItem" ${dataItem.status === 'complete' ? 'checked' : ''}>
                                       <span class="custom-control-indicator border border-secondary"></span>
                                       <span class="custom-control-description">完了</span>
                                   </label>
                               </li>
                               <li class="list-inline-item">
                                   <button class="btn btn-secondary btn-sm js-editItem">編集</button>
                               </li>
                           </ul>
                       </div>
                   </div>
               </div>
           </li>
       `;
   });
   ul.innerHTML = html;
   utilFunc.emptyHtml(stage);
   stage.appendChild(ul);
};


   /**
    * ステータスの描画
    */
   const renderStatus = () => {
       /**
        * 各要素の任意のプロパティに、対象オブジェクトの同名のプロパティの値を設定
        * @param {Node} containerNode 要素をまとめる親ノード
        * @param {Array<string>} childNodeSelectors 対象となる要素のセレクタ
        * @param {String} prop 変更する要素のプロパティ
        * @param {Object} status 変更する要素へ設定する値がまとまっているオブジェクト
        */
       const setValueSameNameProp = (containerNode, childNodeSelectors, prop, status) => {
           childNodeSelectors.forEach((childSelector) => {
               containerNode.querySelector(childSelector)[prop] = status[childSelector.slice(1)];
           });
       };

       setValueSameNameProp(
           document.getElementById('js-statusBox'),
           ['.totalCount', '.leftCount', '.completeCount', '.completionRate'],
           'textContent',
           statusData
       );
   };

   /**
    * 完了済みタスクを削除するボタンの表示切り替え
    */
   const toggleShowTaskDeleteBtn = () => {
       const taskDeleteBtn = document.getElementById('js-taskDeleteBtn');
       const taskDeleteBtnClassList = taskDeleteBtn.classList;
       if (statusData.completeCount > 0) {
           taskDeleteBtnClassList.remove(CLASS_NONE);
       } else if (!taskDeleteBtnClassList.contains(CLASS_NONE)) {
           taskDeleteBtnClassList.add(CLASS_NONE);
       }
   };

   /**
    * 完了ボタンへのイベント登録
    */
   const setCompleteEvent = () => {
       const allcompleteInputs = document.querySelectorAll('.js-completeItem');
       Array.prototype.slice.call(allcompleteInputs).forEach((completeInput, index) => {
           completeInput.addEventListener('click', (e) => {
               model.setItem('changeStatus', [index, e.currentTarget.checked]);
           });
       });
   };

   /**
    * モーダルモジュール
    */
   const modal = (() => {
       const _wrapper = document.getElementById('js-modal');
       const _modalBg = _wrapper.querySelector('.modal-bg');
       const _modalCloseBtn = _wrapper.querySelector('.js-modal-close');
       const _form = document.forms['js-taskEdit'];
       const _formInputText = _form.querySelector('input[type="text"]');
       const _formInputDate = _form.querySelector('input[type="date"]');

       /**
        * モーダルを開く
        * @public
        */
       const open = () => {
           _wrapper.style.display = 'block';
       };

       /**
        * モーダルを閉じる
        * @public
        */
       const close = () => {
           _wrapper.style.display = 'none';
       };

       /**
        * モーダル内のフォームを初期化
        * @public
        */
       const initForm = (index) => {
           const itemState = model.getItem(index);
           _formInputText.value = itemState.content;
           _formInputDate.value = itemState.limit;
           Array.prototype.slice.call(_form.querySelectorAll('input[type="radio"]')).forEach((item) => {
               if (+item.value === +itemState.priority) {
                   item.checked = true;
               } else if (item.checked) {
                   item.checked = false;
               }
           });
       };

       /**
        * モーダルを閉じるイベントを登録
        * @private
        */
       const _setCloseEvent = () => {
           [_modalBg, _modalCloseBtn].forEach((item) => {
               item.addEventListener('click', () => {
                   close();
               });
           });
       };

       /**
        * モーダル内のフォームのイベント登録
        *      編集された内容にステートを更新
        * @private
        */
       const _setEditFormEvent = () => {
           const setClear = () => {
               const btnClear = _form.querySelector('input[type="reset"]');
               if (!btnClear) {
                   return;
               }
               btnClear.addEventListener('click', (e) => {
                   e.preventDefault();
                   _form.reset();
                   _formInputDate.value = formattedToday;
               });
           };

           const setAdd = () => {
               _form.addEventListener('submit', (e) => {
                   e.preventDefault();
                   const index = modal.editBtnIndex;
                   let content = _form.content.value;
                   const priority = utilFunc.getCheckedRadioValue(_form.priority);
                   const limit = _form.limit.value;
                   if (utilFunc.isBlank(content)) {
                       alert('内容を入力してください');
                       return;
                   }
                   content = content.trim();
                   model.setItem('edit', [index, content, priority, limit]);
                   close();
               });
           };

           setClear();
           setAdd();
       };

       /**
        * 初期設定
        * @private
        */
       const _init = () => {
           _modalBg.setAttribute('style', `
               position: fixed;
               top: 0;
               right: 0;
               bottom: 0;
               left: 0;
               z-index: -1;
               background-color: rgba(0,0,0,.5);
           `);
           _setCloseEvent();
           _setEditFormEvent();
       };
       _init();

       return {
           editBtnIndex: null,
           open,
           close,
           initForm
       };
   })();

   /**
    * 編集ボタンへのイベント登録
    */
   const setEditEvent = () => {
       const allEditBtn = document.querySelectorAll('.js-editItem');
       Array.prototype.slice.call(allEditBtn).forEach((editBtn, index) => {
           editBtn.addEventListener('click', () => {
               modal.initForm(index);
               modal.open();
               modal.editBtnIndex = index;
           });
       });
   };

   /**
    * 完了済みタスクをゴミ箱へ移動
    */
   const setDeleteCompleteTask = () => {
       const deleteBtn = document.getElementById('js-taskDeleteBtn').firstElementChild;
       if (!deleteBtn) {
           return;
       }
       deleteBtn.addEventListener('click', (e) => {
           e.preventDefault();
           model.removeCompletedItem();
       });
   };

   /**
    * 並び替え
    */
   const setSortTask = () => {
       const CLASS_CONTAINER = 'js-sort';
       const sortBtns = document.getElementById(CLASS_CONTAINER).getElementsByTagName('button');
       if (sortBtns.length < 1) {
           return;
       }
       Array.prototype.slice.call(sortBtns).forEach((btn) => {
           btn.addEventListener('click', (e) => {
               e.preventDefault();
               if (e.currentTarget.classList.contains(`${CLASS_CONTAINER}-priority`)) {
                   model.sortItem(['status', 'priority', 'limit'], ['', '', 'asc']);
               } else if (e.currentTarget.classList.contains(`${CLASS_CONTAINER}-limit`)) {
                   model.sortItem(['status', 'limit', 'priority'], ['', 'asc', '']);
               }
           });
       });
   };

   /**
    * 全タスク削除
    */
   const setDeleteAllTask = () => {
       const deleteBtn = document.getElementById('js-removeAllItem');
       if (!deleteBtn) {
           return;
       }
       deleteBtn.addEventListener('click', () => {
           const res = confirm('本当に全タスクを削除して良いですか？ ※復元できません');
           if (res) {
               model.deleteAllItem();
               lStorage.removeItem('app');
           }
       });
   };

   /**
    * 画面の描画アップデート
    */
   const render = () => {
       renderTask();
       renderStatus();
       toggleShowTaskDeleteBtn();
       setCompleteEvent();
       setEditEvent();
   };

   /**
    * メインコンテンツエリアの初期表示
    */
   const showFirstMainContent = () => {
       if (lStorage.app && lStorage.app !== '[]') {
           model.setItem('all', JSON.parse(lStorage.app));
       } else {
           let html = checkUserAgent.getAlertMessage() ? checkUserAgent.getAlertMessage() : '';
           html += '<div class="alert alert-info" role="alert">下記フォームからタスクを入力してください</div>';
           stage.innerHTML = html;
       }
   };

   /**
    * ディスパッチャーへのイベント登録
    */
   const setDispatchEvent = () => {
       model.dispatcher.addEventListener('dataChange', () => {
           statusData.init();
           render();
           localStorage.app = JSON.stringify(model.getItem());
       });
   };

  /**
* アプリケーション開始
*/
function start() {
   setDispatchEvent();
   showFirstMainContent();
   setInputDateValue();
   setFormEvent();
   statusData.init();
   setDeleteCompleteTask();
   setSortTask();
   setDeleteAllTask();
   generateCalendar(currentYear, currentMonth, events);
}

// アプリケーション開始
start();


};

TO_DO_APP();