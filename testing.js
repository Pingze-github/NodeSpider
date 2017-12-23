
const picker = require('./lib/picker');

process.on('unhandledRejection', rej => console.error(rej));

async function foo () {
  const plan = {
    url: 'https://www.iplaysoft.com/',
    headers: {},
    list: [
      {
        item: 'div[class="entry"]',
        filter: function (v) {return v},
        save: {
          title: '.entry-title a # text',
          href: '.entry-title a # attr:href',
          categoryList: {
            item: '.entry-cat a[rel="category tag"]',
            save: 'text'
          },
          osList: {
            item: '.entry-cat a[rel="tag"]',
            save: 'text'
          }
        }
      },
      {
        item: 'div.entry-mixed',
        save: {
          title: '.entry-title a # text',
          href: '.entry-title a # attr:href',
          tagstr: '.entry-cpt-label # text',
        },
        dealer: [
          {
            map: function (v) {
              const tagstr = v.tagstr;
              v.categoryList = tagstr.substring(0, tagstr.indexOf('//')).trim().split(',');
              v.osList = tagstr.substring(tagstr.indexOf('//') + 2).trim().split(',');
              v.osList = v.osList.map(v1 => v1.trim());
              return v;
            }
          }, {
            omit: ['tagstr']
          }
        ]
      }
    ]
  };
  result = await picker(plan);
  console.log(result);
  //console.log(result[0]);
}
foo();

// TODO 多级列表支持
// 一个函数，给定基准元素、save，递归申城
