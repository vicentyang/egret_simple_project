import XButton from 'common/modules/view/component/xButton';
import ToggleButton from 'common/modules/view/component/toggleButton';
import XGroup from 'common/modules/view/component/xGroup';
import Regulation from '../modules/view/regulation';
import Scroller from '../modules/view/scroller';
import OperatingFloor from '../modules/view/operatingFloor';
import Tips from '../modules/view/tips';
import BackGroundLayer from '../modules/view/backGroundLayer';
import AnimationLayer from '../modules/view/animationLayer';
import HelpPanel from '../modules/view/helpPanel';
import BorderLayer from '../modules/view/borderLayer';
import config from '../data/config';
export default class BuildScenes {

    static createSence(senceData: any, game: Phaser.Game, mainGriupName: string, presenter) {
        let mainPanel = null;
        let _createDisplayObject = (ele, parent) => {
            let component = Array.prototype.slice.call(ele.children);

            parent = parent || game.world;
            component.forEach((ele, index) => {

                let attrs = this.getAttributes(ele);
                attrs['displayObjType'] = ele.localName;
                let displayObject = this.buildDisplayObject(game, parent, attrs, mainGriupName, presenter);
                /**
                 * 一些对象的属性必须在添加到场景前设置
                 */
                this.fixDisplayObject(game, displayObject, parent, attrs, mainGriupName);

                // if (attrs['id'] === 'spinsText') {
                //     debugger; // tslint:disable-line
                // }

                if (parent.name && parent.name === mainGriupName) {
                    mainPanel = displayObject;
                } else {
                    if (mainPanel !== null) {

                        /**
                         * 不是完整的皮肤ui，没有自定义组件 不能出现相同的id，所以fix regulation
                         */

                        let reg = new RegExp(parent.name);
                        if (parent.name && reg.test(ele.id)) {
                            let _id = ele.id.replace(`${parent.name}_`, '');
                            parent[_id] = displayObject;
                        } else {
                            mainPanel[ele.id] = displayObject;
                        }
                        // if (ele['id'].test(//))
                    }
                }

                // 拥有子标签说明这是一个实体元素或者是不包含实体元素的容器, 否则肯定是容器，并且含有其他容器或者其他实体元素
                if (ele.children && ele.children.length !== 0) {

                    // button|skinname 会以子标签的形式 但不是一个容器
                    if (!ele.localName.toLowerCase().match(/button|skinname/)) {

                        _createDisplayObject(ele, displayObject);
                    } else {
                        this.buildButton(ele, displayObject);
                    }

                } else {
                    // console.log('data', parent.name);
                    // console.dir(value);
                }

                /**
                 * 设置属性值必须在确定这个displayObject不是一个容器之后
                 * 因为一些属性要根据容器的width 和 height进行计算，只有容器内部的子元素全部添加完成之后，容器的width height才能最终确定
                 */
                this.setProprities(game, displayObject, parent, attrs);

                /**
                 * 必须在属性值都更新之后再添加进父组件中
                 */
                parent.add(displayObject);
            });
        };

        _createDisplayObject(senceData.children[0], game.world);
    }

    static getAttributes(ele: any) {
        let attrs = {};
        let _attrs = Array.prototype.slice.call(ele.attributes);
        _attrs.forEach((attr) => {
            attrs[attr.name] = attr.value;
        });
        return attrs;
    }

    static creatRect(game: Phaser.Game, width: number, height: number) {
        let graphic: Phaser.Graphics = new Phaser.Graphics(game, 0, 0);
        graphic.beginFill(0x000000, 0);
        graphic.drawRect(0, 0, width, height);
        graphic.endFill();
        return graphic;
    }

    // 类数组 检测是否含有某个值
    static getProperty(attrs: any[], property) {
        for (var i in attrs) {
            if (attrs[i] && attrs[i]['name'] === property) {
                return attrs[i]['value'];
            }
        }

        return null;
    }

    static buildButton(element: any, _button: Phaser.Button) {
        let frame = '';
        let frames = [];
        function findPropertys(ele) {

            Array.prototype.slice.call(ele.children).forEach((_ele, index) => {
                if (_ele.children && _ele.children.length !== 0) {
                    findPropertys(_ele);
                } else {
                    if (_ele.localName === 'Image') {
                        let sourceKeys = ['source', 'source.down', 'source.disabled'];

                        sourceKeys.forEach((value) => {
                            let _arr = _ele.getAttribute(value) ? _ele.getAttribute(value).split('.') : [];
                            let _key = _arr[1] || '';
                            frames.push(_key);

                            if (!frame) {
                                // frame = _arr[0].replace('_json', '');
                                frame = _arr[0];
                            }
                        });
                    }
                }
            });
        }

        findPropertys(element);

        _button.loadTexture(frame);
        _button.setFrames(frames[0], frames[0], frames[1], frames[0]);

        /** TODO:
         * xbutton 要新加一个set方法
         */
        _button['disabledFrame'] = frames[2];
        _button['defaultFrameName'] = _button['frameName'] = frames[0];
        _button['upFrames'] = [frames[0], frames[0], frames[1], frames[0]];
        _button['downFrames'] = [frames[1], frames[1], frames[0], frames[1]];
    }

    // static getDisPlayObject(parent, name) {
    //     return parent.getByName(name);
    // }

    /** TODO:
    * Group 部分可以分离出去
    * 子页面间的控制用事件监听不再访问presenter
    */
    static buildDisplayObject(game: Phaser.Game, parent: any, attrs: Object, mainGriupName: string, presenter) {
        let displayObjType = attrs['displayObjType'];
        let id = attrs['id'];
        let displayObject;
        switch (displayObjType) {
            case 'Group': {
                /** TODO:
                * 怎样 使用变量当构造函数
                */
                if (parent.name && parent.name === mainGriupName && presenter) {
                    switch (id) {

                        /** TODO:
                        * helppanel中的close按钮的事件绑定优化，涉及到子页面之间的通信，涉及到事件触发机制
                        */
                        case 'HelpPanel': {
                            displayObject = new HelpPanel(game, presenter.closeHelp.bind(presenter), config.HELP_NUM, 'help');
                            break;
                        }
                        case 'OperatingFloor': {
                            displayObject = new OperatingFloor(game, presenter);
                            break;
                        }
                        case 'Scroller': {
                            displayObject = new Scroller(game);
                            break;
                        }
                        case 'BorderLayer': {
                            displayObject = new BorderLayer(game);
                            break;
                        }
                        case 'AnimationLayer': {
                            displayObject = new AnimationLayer(game);
                            break;
                        }
                        // case 'HoldCardLayer': {
                        //     displayObject = new HoldCardLayer(game);
                        //     break;
                        // }
                        case 'Tips': {
                            displayObject = new Tips(game);
                            break;
                        }
                        case 'BackGroundLayer': {
                            displayObject = new BackGroundLayer(game);
                            break;
                        }
                        default: {
                            console.log('似乎没有这个id的对应的代码文件', id);
                            displayObject = new XGroup(game);
                        }
                    }

                    /** TODO:
                    * 这部分的判断和setview中的有多余，待优化
                    */
                    presenter.setView(displayObject);
                } else if (/Regulation/.test(id)) {
                    /** TODO:
                    * 重新优化 Regulation 不需要传入那么多参数了
                    */
                    displayObject = new Regulation(game, [], 0, '', () => { });
                } else {
                    displayObject = new XGroup(game);
                }

                break;
            }
            case 'Button': {
                displayObject = new XButton(game);
                break;
            }
            case 'ToggleButton': {
                displayObject = new ToggleButton(game);
                break;
            }
            case 'Image': {
                displayObject = new Phaser.Image(game, 0, 0, '');
                break;
            }
            case 'Sprite': {
                displayObject = new Phaser.Sprite(game, 0, 0);
                break;
            }
            case 'BitmapLabel': {
                /** 第三个参数 font必须在创建时传入
                * 因为BitmapText.updateText() 中没有对_data作为空的判断, 报错会中断代码
                * 创建时先随机
                */
                var font = Object.keys(game.cache['_cache'].bitmapFont)[0];
                displayObject = new Phaser.BitmapText(game, 0, 0, font, '', 15, 'center');
                break;
            }
            case 'Label': {
                displayObject = new Phaser.Text(game, 0, 0, '');
                break;
            }
            case 'Rect': {

                displayObject = new Phaser.Graphics(game, 0, 0);
                displayObject.beginFill(0x000000, .7);
                displayObject.drawRect(0, 0, parent.width, parent.height);
                displayObject.endFill();
                break;
            }
            default: {
                console.log(`${displayObjType} not found!`);
                return;
            }
        }

        displayObject['displayObjType'] = displayObjType;

        return displayObject;
    }

    /**
     * egret 允许为group设置width height
     * phaser group的width 是由内容物撑开的
     * 当设置了全屏的属性时为group添加一个撑开的rect
     */
    static fixDisplayObject(game: Phaser.Game, displayObject, parent, attrs, mainGriupName: string) {
        displayObject['name'] = attrs['id'] || '';
        parent = parent.name === mainGriupName ? game : parent;
        // let _x = 0;
        // let _y = 0;
        if (displayObject['displayObjType'] === 'Group') {

            let _width = 0;
            let _height = 0;
            /**
             * bottom top 同时存在；改变高度; y 就是top值
             * 同一层级下的内容的边界会影响parent的width和height,会影响定位，在最顶层--也就是maingroup下的group使用了自适应的适配，统一以game的尺寸为参照
             * displayObject.height = parent.height - top - bottom;
             */
            if (attrs.hasOwnProperty('bottom') && attrs.hasOwnProperty('top')) {
                _height = parent.height - Number(attrs['top']) - Number(attrs['bottom']);
            }
            /**
             * left right 同时存在；改变宽度; x 就是left值
             * displayObject.width = parent.width - left - right;
             */
            if (attrs.hasOwnProperty('left') && attrs.hasOwnProperty('right')) {
                _width = parent.width - Number(attrs['right']) - Number(attrs['left']);
            }

            if (!(_width === 0 && _height === 0)) {

                displayObject.addChild(this.creatRect(game, _width, _height));
            }
        }
        if (displayObject['displayObjType'] === 'Image' || displayObject['displayObjType'] === 'Sprite') {

            let _width = 0;
            let _height = 0;
            /**
             * bottom top 同时存在；改变高度; y 就是top值
             * displayObject.height = parent.height - top - bottom;
             */
            if (attrs.hasOwnProperty('bottom') && attrs.hasOwnProperty('top')) {
                _height = parent.height - Number(attrs['top']) - Number(attrs['bottom']);
                // displayObject['y'] = attrs['top'];
            }
            /**
             * left right 同时存在；改变宽度; x 就是left值
             * displayObject.width = parent.width - left - right;
             */
            if (attrs.hasOwnProperty('left') && attrs.hasOwnProperty('right')) {
                _width = parent.width - Number(attrs['right']) - Number(attrs['left']);
                // displayObject['width'] = parent.width - attrs['right'] - attrs['left'];
                // displayObject['x'] = attrs['left'];
            }

            if (attrs.hasOwnProperty('source')) {
                let value = attrs['source'];
                let _arr = value.split('.') || [];
                // let _key = _arr[0].replace(/_json|_png/, '');
                let _key = _arr[0];
                displayObject.key = _key; // 仅设这个值为什么不能生效？？？
                displayObject.loadTexture(_key);
                if (_arr.length > 1) {
                    let frame = _arr[1];
                    displayObject.frameName = frame;
                }
                if (_height !== 0) {
                    displayObject['height'] = _height;
                }
                if (_width !== 0) {
                    displayObject['width'] = _width;
                }
            }
            // displayObject[]
        }
    }

    static setProprities(game: Phaser.Game, displayObject, parent, attrs) {

        let style = {};
        let resPro = {};

        // if (attrs['id'] === 'bonusText') {
        //     debugger; // tslint:disable-line
        // }

        for (let attr in attrs) {
            if (attrs[attr] !== undefined) {
                let name = attr;
                let value = attrs[attr];

                switch (name) {
                    case 'id': {
                        displayObject['name'] = value;

                        if (value === 'bonusTextBox') {
                            // debugger; // tslint:disable-line
                        }
                        break;
                    }
                    case 'x':
                    case 'y':
                    case 'text':
                    case 'label': {
                        displayObject[name] = value;
                        break;
                    }
                    case 'height':
                    case 'width': {
                        displayObject[name] = Math.floor(Number(value));
                        break;
                    }
                    case 'size': {
                        style['fontSize'] = value + 'px';
                        // displayObject['fontSize'] = value;
                        break;
                    }
                    case 'visible': {
                        displayObject[name] = (value === 'true');
                        break;
                    }
                    case 'font': {
                        // displayObject[name] = value.replace(/_fnt/, '');
                        displayObject[name] = value;
                        let fontData = game.cache.getBitmapFont(value);
                        console.log('data', fontData);
                        displayObject['fontSize'] = fontData['font']['size'] || 15;
                        break;
                    }
                    case 'textAlign': {
                        style['textAlign'] = value;
                        // displayObject['align'] = value;
                        break;
                    }
                    case 'textColor': {
                        // 粗暴的颜色转换
                        style['fill'] = value.replace('0x', '#');
                        // displayObject['fill'] = value.replace('0x', '#');
                        break;
                    }
                    case 'fillAlpha': {
                        displayObject['alpha'] = value;
                        break;
                    }
                    case 'anchorOffsetX':
                    case 'anchorOffsetY': {
                        // 锚点设置还有点问题 主要是视图看到的对象的宽和实际创建出来的宽度不一致
                        // 暂时只能将锚点设成0.5 或 1
                        if (displayObject.anchor) {
                            let _name = name.charAt(name.length - 1).toLowerCase();
                            // displayObject.anchor[_name] = Number(value) / (displayObject.width || 0);
                            displayObject.anchor[_name] = 0.5;
                        }
                        break;
                    }
                    case 'scaleX':
                    case 'scaleY': {
                        if (displayObject.scale) {
                            let _name = name.charAt(name.length - 1).toLowerCase();
                            displayObject.scale[_name] = Number(value);
                        }
                        break;
                    }
                    case 'source': {
                        if (displayObject['displayObjType'] !== 'Image' && displayObject['displayObjType'] !== 'Sprite') {
                            /** TODO:
                            * 使用正则匹配文件后缀
                            */
                            let _arr = value.split('.') || [];
                            // let _key = _arr[0].replace(/_json|_png/, '');
                            let _key = _arr[0];
                            displayObject.key = _key; // 仅设这个值为什么不能生效？？？
                            displayObject.loadTexture(_key);
                            if (_arr.length > 1) {
                                let frame = _arr[1];
                                displayObject.frameName = frame;
                            }
                        }
                        break;
                    }

                    case 'horizontalCenter':
                    case 'verticalCenter':
                    case 'top':
                    case 'left':
                    case 'bottom':
                    case 'right': {
                        resPro[name] = Number(value);
                        break;
                    }
                    case 'displayObjType': {
                        break;
                    }
                    default: {
                        console.log(`${name}=${value}  can't be set`);
                    }
                }
            }
        }

        if (!this.isEmptyObject(style)) {
            style['fill'] = style['fill'] || '#fff';
            this.updateText(displayObject, style);
            displayObject.anchor.y = displayObject.anchor.y;
            displayObject.anchor.x = displayObject.anchor.x;
            /** NOTE:
            * updateText 之后改变了displayObject的width和height
            * 需要重新设置anchor 然后x，y才会根据新的宽高更新x,y的值？？？
            */
        }

        if (!this.isEmptyObject(resPro)) {
            this.updateResponsitivePro(displayObject, parent, resPro);
        }
    }

    /**
     * Phaser.Text 单设置某个属性无法刷新整体，比如只设置字号 width和height不会改变
     * 但是updatetext 之后的width 和 height又改变了  之前top bottom 是根据width 和 height来计算的 现在又不争取了
     * text anchor暂时只能设置成0.5
     */
    static updateText(displayObject, style) {
        if (displayObject.setStyle) {

            displayObject.anchor.set(.5);
            displayObject.setStyle(style, true);
            displayObject.updateText();
        }
    }

    /**
     * 自适应属性不同组合时的处理
     * top
     * bottom
     * right
     * left
     * horizontalCenter
     * verticalCenter
     */
    static updateResponsitivePro(displayObject, parent, resPro) {
        /** TODO:
        * 计算结果为小数时的处理
        */

        if (displayObject.name === 'helpButton') {

            // debugger; // tslint:disable-line
        }
        // let parent = displayObject.parent;
        /**
         * top; horizontalCenter 优先
         *  y = value;
         */
        if (resPro.hasOwnProperty('top') && !resPro.hasOwnProperty('bottom')) {
            displayObject['y'] = resPro['top'];
        }
        /**
         * bottom; horizontalCenter 优先
         *  y = parent.height - displayobject.height - value;
         */
        if (resPro.hasOwnProperty('bottom') && !resPro.hasOwnProperty('top')) {
            displayObject['y'] = parent.height - displayObject.height - resPro['bottom'];
        }
        /**
         * left; verticalCenter 优先
         *  x = value;
         */
        if (resPro.hasOwnProperty('left') && !resPro.hasOwnProperty('right')) {
            displayObject['x'] = resPro['left'];
        }
        /**
         * right; verticalCenter 优先
         *  x = parent.width - displayobject.width - value;
         */
        if (resPro.hasOwnProperty('right') && !resPro.hasOwnProperty('left')) {
            displayObject['x'] = parent.width - displayObject.width - resPro['right'];
        }
        /**
         * 1.必须在  verticalCenter 之前设置   verticalCenter需要根据 height 进行计算，这两个属性会影响height的值
         * 2.Group 同时存在 这两个属性 必须
         * bottom top 同时存在；改变高度; y 就是top值
         * displayObject.height = parent.height - top - bottom;
         */
        if (resPro.hasOwnProperty('bottom') && resPro.hasOwnProperty('top') && displayObject.displayObjType !== 'Group') {
            displayObject['height'] = parent.height - resPro['top'] - resPro['bottom'];
            displayObject['y'] = resPro['top'];
        }
        /**
         * 必须在  horizontalCenter 之前设置   horizontalCenter需要根据 width 进行计算，这两个属性会影响width的值
         * left right 同时存在；改变宽度; x 就是left值
         * displayObject.width = parent.width - left - right;
         */
        if (resPro.hasOwnProperty('left') && resPro.hasOwnProperty('right') && displayObject.displayObjType !== 'Group') {
            displayObject['width'] = parent.width - resPro['right'] - resPro['left'];
            displayObject['x'] = resPro['left'];
        }
        /**
         * verticalCenter; 优先 会覆盖掉以上同属性的设置
         *
         *  y = (parent.height - displayObject.height) / 2 + value;
         */
        if (resPro.hasOwnProperty('verticalCenter')) {
            displayObject['y'] = (parent.height - displayObject.height) / 2 + resPro['verticalCenter'];
        }
        /**
         * horizontalCenter
         *
         *  x = (parent.width - displayObject.width) / 2 + value;
         */
        if (resPro.hasOwnProperty('horizontalCenter')) {
            displayObject['x'] = (parent.width - displayObject.width) / 2 + resPro['horizontalCenter'];
        }

        /**
         * bug
         * 设置了锚点之后 显示对象还是以左上角为原点, 但是实际应该是以锚点为原点 需要添加修正
         */
        if (displayObject['anchor']) {

            displayObject['x'] += displayObject['width'] * displayObject['anchor']['x'];
            displayObject['y'] += displayObject['height'] * displayObject['anchor']['y'];
        }
    }

    static isEmptyObject(e) {
        var t;
        for (t in e) {
            if (t) {
                return !1;
            }
        }
        return !0;
    }
}
