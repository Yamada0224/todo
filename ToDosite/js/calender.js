// calender.js

// TO_DO_APP 関数を先頭に配置
const TO_DO_APP = () => {
    const date = new Date();
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth();
    const events = [/* your events array */];

    // generateCalendar 関数を呼び出し
    generateCalendar(currentYear, currentMonth, events);
};
/**
 * イベント情報をカレンダーに追加
 * @param {Object} calendarEl カレンダーの要素
 * @param {Number} currentYear カレンダーの表示年
 * @param {Number} currentMonth カレンダーの表示月
 * @param {Array} events イベント情報の配列
 */
function appendEventsToCalendar(calendarEl, currentYear, currentMonth, events) {
    console.log('Current Year:', currentYear);
    console.log('Current Month:', currentMonth);
    console.log('Events:', events);

    events.forEach(event => {
        if (event.date.getFullYear() === currentYear && event.date.getMonth() === currentMonth) {
            const dayCell = calendarEl.querySelector(`td[data-date="${event.date.getDate()}"]`);
            // しるしのクラスを重要度に応じて設定
            const importanceClass = getConfigImportanceClass(event.importance);
            dayCell.innerHTML += `<div class="${importanceClass}"></div>`;
        }
    });
}

/**
 * カレンダーを生成する関数
 * @param {Number} year カレンダーの表示年
 * @param {Number} month カレンダーの表示月
 * @param {Array} events イベント情報の配列
 */
function generateCalendar(year, month, events) {
    const calendarEl = document.getElementById('calendar');
    const date = new Date();
    const currentYear = year || date.getFullYear();
    const currentMonth = month || date.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // カレンダーのHTML構造を生成
    let calendarHtml = '<table><thead><tr>';
    for (let i = 0; i < 7; i++) {
        calendarHtml += `<th>${['日', '月', '火', '水', '木', '金', '土'][i]}</th>`;
    }
    calendarHtml += '</tr></thead><tbody><tr>';

    for (let i = 1; i <= daysInMonth; i++) {
        const dayOfWeek = new Date(currentYear, currentMonth, i).getDay();
        if (i === 1) {
            calendarHtml += '<tr>';
            for (let j = 0; j < dayOfWeek; j++) {
                calendarHtml += '<td></td>';
            }
        }
        calendarHtml += `<td data-date="${i}">${i}</td>`;
        if (dayOfWeek === 6) {
            calendarHtml += '</tr>';
            if (i < daysInMonth) {
                calendarHtml += '<tr>';
            }
        } else if (i === daysInMonth) {
            for (let j = dayOfWeek + 1; j <= 6; j++) {
                calendarHtml += '<td></td>';
            }
            calendarHtml += '</tr>';
        }
    }
    calendarHtml += '</tbody></table>';
    calendarEl.innerHTML = calendarHtml;

    // イベント情報をカレンダーに追加
    appendEventsToCalendar(calendarEl, currentYear, currentMonth, events);
}

export { generateCalendar };
